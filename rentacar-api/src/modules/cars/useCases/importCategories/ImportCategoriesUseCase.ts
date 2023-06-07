import { parse } from 'csv-parse';
import fs from 'fs';

import { type ICategoryRepository } from '../../repositories/ICategoriesRepository';

interface IImportCategory {
  name: string
  description: string
}

class ImportCategoriesUseCase {
  constructor (private readonly categoriesRepository: ICategoryRepository) {}

  async loadCategories (file: Express.Multer.File): Promise<IImportCategory[]> {
    return await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path);
      const categories: IImportCategory[] = [];

      const parseFile = parse();

      stream.pipe(parseFile);

      parseFile
        .on('data', (line) => {
          const [name, description] = line;

          categories.push({
            name,
            description
          });
        })
        .on('end', () => {
          void fs.promises.unlink(file.path);
          resolve(categories);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async execute (file: Express.Multer.File): Promise<void> {
    const categories = await this.loadCategories(file);

    categories.map(async (category) => {
      const { name, description } = category;

      const existCategory = this.categoriesRepository.findByName(name);

      if (existCategory == null) {
        this.categoriesRepository.create({
          name,
          description
        });
      }
    });
  }
}

export { ImportCategoriesUseCase };
