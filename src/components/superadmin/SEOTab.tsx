import SEONotificationCard from './SEONotificationCard';
import MarketingContentCard from './MarketingContentCard';
import SEOResourcesCard from './SEOResourcesCard';
import SEOFilesCard from './SEOFilesCard';

const SEOTab = () => {
  return (
    <div className="space-y-6">
      <SEONotificationCard />
      <MarketingContentCard />
      <SEOResourcesCard />
      <SEOFilesCard />
    </div>
  );
};

export default SEOTab;
