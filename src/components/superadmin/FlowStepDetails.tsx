import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import FlowStepInitial from './flow/FlowStepInitial';
import FlowStepAdmin from './flow/FlowStepAdmin';
import FlowStepCompliance from './flow/FlowStepCompliance';
import FlowStepFormatting from './flow/FlowStepFormatting';

const FlowStepDetails = () => {
  return (
    <Card className="border-2 border-purple-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Icon name="Workflow" size={24} />
          Детальное описание этапов
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <FlowStepInitial />
          <FlowStepAdmin />
          <FlowStepCompliance />
          <FlowStepFormatting />
        </div>
      </CardContent>
    </Card>
  );
};

export default FlowStepDetails;