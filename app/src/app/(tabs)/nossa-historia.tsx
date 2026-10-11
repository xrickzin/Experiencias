import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';

export default function NossaHistoria() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Nossa História"
        title="O álbum de vocês"
        description="As experiências que viraram memória."
      />
      <EmptyState
        title="Ainda não há memórias"
        description="Quando uma experiência for vivida e registrada, ela passa a morar aqui, como as páginas de um álbum que vocês montam juntos."
      />
    </Screen>
  );
}
