export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clerkUserId } = req.query;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/SubAccounts?filterByFormula={parent_user_id}='${clerkUserId}'`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
        }
      }
    );

    const data = await response.json();

    const members = data.records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return res.status(200).json({ members });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
