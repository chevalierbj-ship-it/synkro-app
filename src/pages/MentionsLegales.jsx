import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalPageLayout, {
  LegalSection,
  LegalParagraph
} from '../components/LegalPageLayout';

const MentionsLegales = () => {
  const { t } = useTranslation();

  return (
    <LegalPageLayout
      title={t('mentions.title')}
      seoTitle={t('mentions.seo.title')}
      seoDescription={t('mentions.seo.description')}
      lastUpdated="10 décembre 2024"
    >
      <LegalSection title={t('mentions.editor.title')}>
        <LegalParagraph>
          <strong>{t('mentions.editor.name')}</strong><br />
          Synkro<br /><br />
          <strong>{t('mentions.editor.address')}</strong><br />
          [Adresse à compléter]<br /><br />
          <strong>{t('mentions.editor.email')}</strong><br />
          contact@getsynkro.com<br /><br />
          <strong>{t('mentions.editor.director')}</strong><br />
          [Nom du directeur de publication]
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.hosting.title')}>
        <LegalParagraph>
          <strong>{t('mentions.hosting.provider')}</strong><br />
          Vercel Inc.<br /><br />
          <strong>{t('mentions.hosting.address')}</strong><br />
          340 S Lemon Ave #4133<br />
          Walnut, CA 91789<br />
          États-Unis<br /><br />
          <strong>{t('mentions.hosting.website')}</strong><br />
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#8B5CF6' }}
          >
            https://vercel.com
          </a>
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.intellectual.title')}>
        <LegalParagraph>
          {t('mentions.intellectual.content')}
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.data.title')}>
        <LegalParagraph>
          {t('mentions.data.content')}
        </LegalParagraph>
        <LegalParagraph>
          {t('mentions.data.rights')}
        </LegalParagraph>
        <LegalParagraph>
          <strong>{t('mentions.data.contact')}</strong><br />
          contact@getsynkro.com
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.cookies.title')}>
        <LegalParagraph>
          {t('mentions.cookies.content')}
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.liability.title')}>
        <LegalParagraph>
          {t('mentions.liability.content')}
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('mentions.law.title')}>
        <LegalParagraph>
          {t('mentions.law.content')}
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default MentionsLegales;
