import { getAssetInfoAsync } from 'expo-media-library/legacy';
import { Platform } from 'react-native';

import { dataDaGaleria } from '@/services/galeria';

const info = jest.mocked(getAssetInfoAsync);

describe('data da foto pela galeria do Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    info.mockReset();
  });
  afterEach(() => jest.restoreAllMocks());

  it('acha a imagem pelo número do arquivo que o seletor entrega', async () => {
    info.mockResolvedValue({ creationTime: Date.UTC(2022, 2, 15, 18, 0) } as never);
    expect(await dataDaGaleria('1000331477.jpg')).toBe('2022-03-15T18:00:00.000Z');
    expect(info).toHaveBeenCalledWith('1000331477');
  });

  it('nome sem número, imagem não encontrada ou data absurda: sem data', async () => {
    expect(await dataDaGaleria('IMG_2022.jpg')).toBeNull();
    expect(await dataDaGaleria(null)).toBeNull();
    expect(info).not.toHaveBeenCalled();

    info.mockRejectedValueOnce(new Error('não encontrada'));
    expect(await dataDaGaleria('123.jpg')).toBeNull();
    info.mockResolvedValueOnce({ creationTime: Date.UTC(1970, 0, 1) } as never);
    expect(await dataDaGaleria('123.jpg')).toBeNull();
  });

  it('fora do Android não procura (o EXIF já traz a data)', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(await dataDaGaleria('1000331477.jpg')).toBeNull();
    expect(info).not.toHaveBeenCalled();
  });
});
