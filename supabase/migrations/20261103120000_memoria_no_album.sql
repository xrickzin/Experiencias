-- O álbum e Nossos dias (ADR 045): toda memória está no álbum (o marcante) ou em Nossos dias (o simples).
-- As que já existem continuam no álbum. A coluna fica fora da trava dos detalhes (ADR 042), que lista
-- as colunas travadas uma a uma: qualquer um dos dois muda a escolha a qualquer momento.
alter table public.experiencias add column no_album boolean not null default true;
grant update (no_album) on public.experiencias to authenticated;
