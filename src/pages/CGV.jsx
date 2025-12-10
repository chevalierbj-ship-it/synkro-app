import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalPageLayout, {
  LegalArticle,
  LegalParagraph,
  LegalList
} from '../components/LegalPageLayout';

const CGV = () => {
  const { t } = useTranslation();

  return (
    <LegalPageLayout
      title={t('cgv.title')}
      seoTitle={t('cgv.seo.title')}
      seoDescription={t('cgv.seo.description')}
      lastUpdated="10 décembre 2024"
      showScrollToTop={true}
    >
      <LegalParagraph>
        {t('cgv.intro')}
      </LegalParagraph>

      <LegalArticle number="1" title={t('cgv.article1.title')}>
        <LegalParagraph>{t('cgv.article1.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article1.item1'),
          t('cgv.article1.item2'),
          t('cgv.article1.item3'),
          t('cgv.article1.item4'),
          t('cgv.article1.item5')
        ]} />
      </LegalArticle>

      <LegalArticle number="2" title={t('cgv.article2.title')}>
        <LegalParagraph>{t('cgv.article2.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="3" title={t('cgv.article3.title')}>
        <LegalParagraph>{t('cgv.article3.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article3.item1'),
          t('cgv.article3.item2'),
          t('cgv.article3.item3')
        ]} />
      </LegalArticle>

      <LegalArticle number="4" title={t('cgv.article4.title')}>
        <LegalParagraph>{t('cgv.article4.content')}</LegalParagraph>
        <LegalParagraph>{t('cgv.article4.content2')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="5" title={t('cgv.article5.title')}>
        <LegalParagraph>{t('cgv.article5.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article5.item1'),
          t('cgv.article5.item2'),
          t('cgv.article5.item3')
        ]} />
      </LegalArticle>

      <LegalArticle number="6" title={t('cgv.article6.title')}>
        <LegalParagraph>{t('cgv.article6.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="7" title={t('cgv.article7.title')}>
        <LegalParagraph>{t('cgv.article7.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article7.item1'),
          t('cgv.article7.item2'),
          t('cgv.article7.item3')
        ]} />
      </LegalArticle>

      <LegalArticle number="8" title={t('cgv.article8.title')}>
        <LegalParagraph>{t('cgv.article8.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="9" title={t('cgv.article9.title')}>
        <LegalParagraph>{t('cgv.article9.content')}</LegalParagraph>
        <LegalParagraph>{t('cgv.article9.content2')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="10" title={t('cgv.article10.title')}>
        <LegalParagraph>{t('cgv.article10.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article10.item1'),
          t('cgv.article10.item2'),
          t('cgv.article10.item3'),
          t('cgv.article10.item4')
        ]} />
      </LegalArticle>

      <LegalArticle number="11" title={t('cgv.article11.title')}>
        <LegalParagraph>{t('cgv.article11.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="12" title={t('cgv.article12.title')}>
        <LegalParagraph>{t('cgv.article12.content')}</LegalParagraph>
        <LegalList items={[
          t('cgv.article12.item1'),
          t('cgv.article12.item2'),
          t('cgv.article12.item3'),
          t('cgv.article12.item4')
        ]} />
      </LegalArticle>

      <LegalArticle number="13" title={t('cgv.article13.title')}>
        <LegalParagraph>{t('cgv.article13.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="14" title={t('cgv.article14.title')}>
        <LegalParagraph>{t('cgv.article14.content')}</LegalParagraph>
        <LegalParagraph>{t('cgv.article14.content2')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="15" title={t('cgv.article15.title')}>
        <LegalParagraph>{t('cgv.article15.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="16" title={t('cgv.article16.title')}>
        <LegalParagraph>{t('cgv.article16.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="17" title={t('cgv.article17.title')}>
        <LegalParagraph>{t('cgv.article17.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="18" title={t('cgv.article18.title')}>
        <LegalParagraph>{t('cgv.article18.content')}</LegalParagraph>
      </LegalArticle>

      <LegalArticle number="19" title={t('cgv.article19.title')}>
        <LegalParagraph>{t('cgv.article19.content')}</LegalParagraph>
        <LegalParagraph>
          <strong>Email :</strong> contact@getsynkro.com
        </LegalParagraph>
      </LegalArticle>
    </LegalPageLayout>
  );
};

export default CGV;
