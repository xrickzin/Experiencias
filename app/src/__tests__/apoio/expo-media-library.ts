// Nos testes não há a galeria do aparelho: sem permissão e sem data, como num celular que nega o acesso.
export const requestPermissionsAsync = jest.fn(async () => ({ granted: false }));
export const getAssetInfoAsync = jest.fn(async (): Promise<{ creationTime: number | null }> => ({ creationTime: null }));
