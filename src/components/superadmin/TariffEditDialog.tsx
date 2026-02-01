import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tariff } from './types';

interface TariffEditDialogProps {
  tariff: Tariff | null;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (tariff: Tariff) => void;
}

export const TariffEditDialog = ({ tariff, onClose, onSave, onUpdate }: TariffEditDialogProps) => {
  if (!tariff) return null;

  return (
    <Dialog open={!!tariff} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактирование тарифа</DialogTitle>
          <DialogDescription>
            Изменение цен и параметров тарифного плана
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название тарифа</Label>
            <Input 
              id="name"
              value={tariff.name}
              onChange={(e) => onUpdate({...tariff, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup_fee">Стоимость подключения (₽)</Label>
            <Input 
              id="setup_fee"
              type="number"
              value={tariff.setup_fee || 0}
              onChange={(e) => onUpdate({...tariff, setup_fee: Number(e.target.value)})}
              placeholder="Разовый платёж при подключении"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Первоначальная оплата (₽)</Label>
            <Input 
              id="price"
              type="number"
              value={tariff.price}
              onChange={(e) => onUpdate({...tariff, price: Number(e.target.value)})}
              placeholder="Оплата за первый период"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="renewal_price">Стоимость продления в месяц (₽)</Label>
            <Input 
              id="renewal_price"
              type="number"
              value={tariff.renewal_price || 0}
              onChange={(e) => onUpdate({...tariff, renewal_price: Number(e.target.value)})}
              placeholder="Ежемесячная оплата при продлении"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Период первоначальной оплаты</Label>
            <Select 
              value={tariff.period} 
              onValueChange={(value) => onUpdate({...tariff, period: value})}
            >
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="месяц">месяц</SelectItem>
                <SelectItem value="год">год</SelectItem>
                <SelectItem value="навсегда">навсегда</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="first_month_included"
              checked={tariff.first_month_included ?? false}
              onChange={(e) => onUpdate({...tariff, first_month_included: e.target.checked})}
              className="w-4 h-4"
            />
            <Label htmlFor="first_month_included" className="cursor-pointer">
              Первый месяц включен в стоимость подключения
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={tariff.is_active}
              onChange={(e) => onUpdate({...tariff, is_active: e.target.checked})}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Тариф активен
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};