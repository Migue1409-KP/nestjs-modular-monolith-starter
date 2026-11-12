import { ParametersService } from './parameters.service';
import { ParametersController } from './parameters.controller';

describe('ParametersService', () => {
  const languagesRepository = { findAll: jest.fn(), findAllActive: jest.fn() };
  const service = new ParametersService(languagesRepository as any);

  beforeEach(() => jest.resetAllMocks());

  it('returns only active languages by default', async () => {
    languagesRepository.findAllActive.mockResolvedValue([{ code: 'en' }]);
    await expect(service.findAllLanguages()).resolves.toEqual([{ code: 'en' }]);
    expect(languagesRepository.findAll).not.toHaveBeenCalled();
  });

  it('can include inactive languages', async () => {
    languagesRepository.findAll.mockResolvedValue([{ code: 'en' }, { code: 'xx' }]);
    await expect(service.findAllLanguages(true)).resolves.toHaveLength(2);
    expect(languagesRepository.findAllActive).not.toHaveBeenCalled();
  });
});

describe('ParametersController', () => {
  it('wraps the languages in a success envelope', async () => {
    const parametersService = { findAllLanguages: jest.fn().mockResolvedValue([{ code: 'es' }]) };
    const controller = new ParametersController(parametersService as any);

    await expect(controller.getAllLanguages()).resolves.toEqual({
      status: 'success',
      data: [{ code: 'es' }],
    });
  });
});
