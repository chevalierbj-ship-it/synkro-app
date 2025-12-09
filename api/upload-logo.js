/**
 * API pour l'upload de logo personnalise
 *
 * Supporte deux modes de stockage :
 * 1. Vercel Blob (recommande pour la production)
 * 2. Base64 dans Airtable (fallback si Vercel Blob non configure)
 *
 * Endpoints :
 * - POST /api/upload-logo : Upload un nouveau logo
 * - DELETE /api/upload-logo : Supprime le logo actuel
 */

import { validateEnvForEndpoint } from './lib/validate-env.js';

// Configuration
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validation variables d'environnement Airtable
  const airtableValidation = validateEnvForEndpoint('airtable');
  if (!airtableValidation.valid) {
    console.error('Airtable configuration missing:', airtableValidation.missing);
    return res.status(500).json({
      error: 'Configuration error',
      message: 'Database configuration is missing'
    });
  }

  if (req.method === 'POST') {
    return await handleUpload(req, res);
  }

  if (req.method === 'DELETE') {
    return await handleDelete(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleUpload(req, res) {
  try {
    const { clerkUserId, logoData, fileName, fileType, fileSize } = req.body;

    // Validation des parametres requis
    if (!clerkUserId) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'clerkUserId is required'
      });
    }

    if (!logoData) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'logoData (base64) is required'
      });
    }

    // Validation du type de fichier
    if (fileType && !ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: `Allowed types: ${ALLOWED_TYPES.join(', ')}`
      });
    }

    // Validation de la taille
    // Base64 ajoute ~33% a la taille originale
    const estimatedSize = (logoData.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    // Verifier que l'utilisateur existe et a un plan Pro ou Entreprise
    const user = await getUserFromAirtable(clerkUserId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this clerkUserId'
      });
    }

    const userPlan = user.fields.plan || 'gratuit';
    if (userPlan !== 'pro' && userPlan !== 'entreprise') {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Logo upload is only available for Pro and Enterprise plans'
      });
    }

    // Determiner la methode de stockage
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    let logoUrl;

    if (blobToken) {
      // Utiliser Vercel Blob pour le stockage
      logoUrl = await uploadToVercelBlob(logoData, fileName, fileType, clerkUserId);
    } else {
      // Fallback : stocker en base64 dans Airtable
      // Note: Cette methode n'est pas ideale pour la performance
      // mais fonctionne sans configuration supplementaire
      logoUrl = `data:${fileType};base64,${logoData}`;
      console.log('Warning: Using base64 storage. Consider configuring Vercel Blob for better performance.');
    }

    // Sauvegarder l'URL du logo dans Airtable
    const updateSuccess = await updateUserLogo(user.id, logoUrl);

    if (!updateSuccess) {
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to save logo URL to database'
      });
    }

    console.log('Logo uploaded successfully for user:', clerkUserId);

    return res.status(200).json({
      success: true,
      logoUrl: logoUrl,
      storageMethod: blobToken ? 'vercel-blob' : 'base64',
      message: 'Logo uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
}

async function handleDelete(req, res) {
  try {
    const { clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'clerkUserId is required'
      });
    }

    // Recuperer l'utilisateur
    const user = await getUserFromAirtable(clerkUserId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this clerkUserId'
      });
    }

    const currentLogoUrl = user.fields.custom_logo_url;

    // Supprimer de Vercel Blob si applicable
    if (currentLogoUrl && currentLogoUrl.includes('vercel-storage.com')) {
      try {
        await deleteFromVercelBlob(currentLogoUrl);
      } catch (blobError) {
        console.error('Error deleting from Vercel Blob:', blobError);
        // Continuer meme si la suppression Blob echoue
      }
    }

    // Mettre a jour Airtable
    const updateSuccess = await updateUserLogo(user.id, null);

    if (!updateSuccess) {
      return res.status(500).json({
        error: 'Update failed',
        message: 'Failed to remove logo URL from database'
      });
    }

    console.log('Logo deleted successfully for user:', clerkUserId);

    return res.status(200).json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({
      error: 'Delete failed',
      message: error.message
    });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function getUserFromAirtable(clerkUserId) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula={clerk_user_id}='${clerkUserId}'`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    console.error('Airtable error:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.records && data.records.length > 0 ? data.records[0] : null;
}

async function updateUserLogo(recordId, logoUrl) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users/${recordId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          custom_logo_url: logoUrl || ''
        }
      })
    }
  );

  return response.ok;
}

async function uploadToVercelBlob(base64Data, fileName, fileType, userId) {
  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  // Convertir base64 en Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generer un nom de fichier unique
  const timestamp = Date.now();
  const safeFileName = fileName
    ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    : `logo_${timestamp}`;
  const blobPath = `logos/${userId}/${safeFileName}`;

  // Upload vers Vercel Blob
  const response = await fetch(`https://blob.vercel-storage.com/${blobPath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${BLOB_TOKEN}`,
      'Content-Type': fileType,
      'x-content-type': fileType
    },
    body: buffer
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel Blob upload failed: ${error}`);
  }

  const result = await response.json();
  return result.url;
}

async function deleteFromVercelBlob(url) {
  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  if (!BLOB_TOKEN) {
    return;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${BLOB_TOKEN}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel Blob delete failed: ${error}`);
  }
}
