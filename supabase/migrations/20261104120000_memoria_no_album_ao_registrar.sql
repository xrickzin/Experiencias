-- O álbum e Nossos dias (ADR 045): registrar uma memória direto já escolhendo "Nos nossos dias".
-- A tabela concede insert coluna a coluna; a migração anterior só liberou o update de no_album.
grant insert (no_album) on public.experiencias to authenticated;
