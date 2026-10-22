import { Injectable } from '@nestjs/common';
import { LanguagesRepository } from './repositories/languages.repostiry';
import { Language } from './entities/languages.entity';

@Injectable()
export class ParametersService {
  constructor(private readonly languagesRepository: LanguagesRepository) {}

  async findAllLanguages(includeInactive: boolean = false): Promise<Language[]> {
    return includeInactive
      ? this.languagesRepository.findAll()
      : this.languagesRepository.findAllActive();
  }
}
