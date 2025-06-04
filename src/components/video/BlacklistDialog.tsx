import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface BlacklistDialogProps {
  blacklist: string[];
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export function BlacklistDialog({ blacklist, onAdd, onRemove, onOpenChange }: BlacklistDialogProps) {
  const [newWord, setNewWord] = useState('');

  const handleAdd = () => {
    if (newWord.trim()) {
      onAdd(newWord.trim());
      setNewWord('');
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <span>ブラックリスト</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ブラックリスト管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="除外したい単語を入力"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}>追加</Button>
          </div>
          <div className="space-y-2">
            {blacklist.map((word) => (
              <div key={word} className="flex items-center justify-between p-2 bg-secondary rounded">
                <span>{word}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(word)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 