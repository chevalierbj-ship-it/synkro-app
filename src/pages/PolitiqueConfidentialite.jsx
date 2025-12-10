import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalPageLayout, {
  LegalSection,
  LegalSubSection,
  LegalParagraph,
  LegalList
} from '../components/LegalPageLayout';

const PolitiqueConfidentialite = () => {
  const { t } = useTranslation();

  const subprocessors = [
    {
      name: 'Clerk',
      purpose: t('privacy.subprocessors.clerk.purpose'),
      data: t('privacy.subprocessors.clerk.data'),
      location: t('privacy.subprocessors.clerk.location'),
      website: 'https://clerk.com'
    },
    {
      name: 'Airtable',
      purpose: t('privacy.subprocessors.airtable.purpose'),
      data: t('privacy.subprocessors.airtable.data'),
      location: t('privacy.subprocessors.airtable.location'),
      website: 'https://airtable.com'
    },
    {
      name: 'Stripe',
      purpose: t('privacy.subprocessors.stripe.purpose'),
      data: t('privacy.subprocessors.stripe.data'),
      location: t('privacy.subprocessors.stripe.location'),
      website: 'https://stripe.com'
    },
    {
      name: 'Resend',
      purpose: t('privacy.subprocessors.resend.purpose'),
      data: t('privacy.subprocessors.resend.data'),
      location: t('privacy.subprocessors.resend.location'),
      website: 'https://resend.com'
    },
    {
      name: 'Vercel',
      purpose: t('privacy.subprocessors.vercel.purpose'),
      data: t('privacy.subprocessors.vercel.data'),
      location: t('privacy.subprocessors.vercel.location'),
      website: 'https://vercel.com'
    },
    {
      name: 'Cloudinary',
      purpose: t('privacy.subprocessors.cloudinary.purpose'),
      data: t('privacy.subprocessors.cloudinary.data'),
      location: t('privacy.subprocessors.cloudinary.location'),
      website: 'https://cloudinary.com'
    }
  ];

  return (
    <LegalPageLayout
      title={t('privacy.title')}
      seoTitle={t('privacy.seo.title')}
      seoDescription={t('privacy.seo.description')}
      lastUpdated="10 décembre 2024"
      showScrollToTop={true}
    >
      <LegalParagraph>
        {t('privacy.intro')}
      </LegalParagraph>

      <LegalSection title={t('privacy.controller.title')}>
        <LegalParagraph>
          {t('privacy.controller.content')}<br /><br />
          <strong>Email :</strong> contact@getsynkro.com
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('privacy.dataCollected.title')}>
        <LegalSubSection title={t('privacy.dataCollected.account.title')}>
          <LegalList items={[
            t('privacy.dataCollected.account.item1'),
            t('privacy.dataCollected.account.item2'),
            t('privacy.dataCollected.account.item3')
          ]} />
        </LegalSubSection>

        <LegalSubSection title={t('privacy.dataCollected.event.title')}>
          <LegalList items={[
            t('privacy.dataCollected.event.item1'),
            t('privacy.dataCollected.event.item2'),
            t('privacy.dataCollected.event.item3'),
            t('privacy.dataCollected.event.item4')
          ]} />
        </LegalSubSection>

        <LegalSubSection title={t('privacy.dataCollected.technical.title')}>
          <LegalList items={[
            t('privacy.dataCollected.technical.item1'),
            t('privacy.dataCollected.technical.item2'),
            t('privacy.dataCollected.technical.item3')
          ]} />
        </LegalSubSection>
      </LegalSection>

      <LegalSection title={t('privacy.purposes.title')}>
        <LegalList items={[
          t('privacy.purposes.item1'),
          t('privacy.purposes.item2'),
          t('privacy.purposes.item3'),
          t('privacy.purposes.item4'),
          t('privacy.purposes.item5'),
          t('privacy.purposes.item6')
        ]} />
      </LegalSection>

      <LegalSection title={t('privacy.legalBasis.title')}>
        <LegalList items={[
          t('privacy.legalBasis.item1'),
          t('privacy.legalBasis.item2'),
          t('privacy.legalBasis.item3')
        ]} />
      </LegalSection>

      <LegalSection title={t('privacy.retention.title')}>
        <LegalParagraph>{t('privacy.retention.content')}</LegalParagraph>
        <LegalList items={[
          t('privacy.retention.item1'),
          t('privacy.retention.item2'),
          t('privacy.retention.item3')
        ]} />
      </LegalSection>

      <LegalSection title={t('privacy.subprocessors.title')}>
        <LegalParagraph>{t('privacy.subprocessors.intro')}</LegalParagraph>

        <div style={{
          overflowX: 'auto',
          marginTop: '24px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: 'white'
              }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>
                  {t('privacy.subprocessors.table.provider')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>
                  {t('privacy.subprocessors.table.purpose')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>
                  {t('privacy.subprocessors.table.data')}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>
                  {t('privacy.subprocessors.table.location')}
                </th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((sp, index) => (
                <tr
                  key={sp.name}
                  style={{
                    background: index % 2 === 0 ? '#F5F3FF' : 'white',
                    borderBottom: '1px solid #E9D5FF'
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <a
                      href={sp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#8B5CF6',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      {sp.name}
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{sp.purpose}</td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{sp.data}</td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{sp.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title={t('privacy.transfers.title')}>
        <LegalParagraph>{t('privacy.transfers.content')}</LegalParagraph>
        <LegalList items={[
          t('privacy.transfers.item1'),
          t('privacy.transfers.item2'),
          t('privacy.transfers.item3')
        ]} />
      </LegalSection>

      <LegalSection title={t('privacy.rights.title')}>
        <LegalParagraph>{t('privacy.rights.intro')}</LegalParagraph>
        <LegalList items={[
          t('privacy.rights.item1'),
          t('privacy.rights.item2'),
          t('privacy.rights.item3'),
          t('privacy.rights.item4'),
          t('privacy.rights.item5'),
          t('privacy.rights.item6')
        ]} />
        <LegalParagraph>
          {t('privacy.rights.exercise')}<br />
          <strong>Email :</strong> contact@getsynkro.com
        </LegalParagraph>
        <LegalParagraph>
          {t('privacy.rights.cnil')}
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('privacy.cookies.title')}>
        <LegalParagraph>{t('privacy.cookies.content')}</LegalParagraph>
        <LegalSubSection title={t('privacy.cookies.essential.title')}>
          <LegalParagraph>{t('privacy.cookies.essential.content')}</LegalParagraph>
        </LegalSubSection>
        <LegalSubSection title={t('privacy.cookies.functional.title')}>
          <LegalParagraph>{t('privacy.cookies.functional.content')}</LegalParagraph>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title={t('privacy.security.title')}>
        <LegalParagraph>{t('privacy.security.content')}</LegalParagraph>
        <LegalList items={[
          t('privacy.security.item1'),
          t('privacy.security.item2'),
          t('privacy.security.item3'),
          t('privacy.security.item4')
        ]} />
      </LegalSection>

      <LegalSection title={t('privacy.minors.title')}>
        <LegalParagraph>{t('privacy.minors.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('privacy.updates.title')}>
        <LegalParagraph>{t('privacy.updates.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('privacy.contact.title')}>
        <LegalParagraph>
          {t('privacy.contact.content')}<br /><br />
          <strong>Email :</strong> contact@getsynkro.com
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default PolitiqueConfidentialite;
