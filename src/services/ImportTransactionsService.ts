import fs from 'fs';
import csv from 'csv-parse';
import { resolve } from 'path';
import Transaction from '../models/Transaction';
import CategoryRespository from './../repositories/CategoryRespository';
import TransactionsRepository from './../repositories/TransactionsRepository';
import { In, getCustomRepository } from 'typeorm';
import Category from '../models/Category';

interface DTO {
  path: string
}

interface TransactionDTO {
  title: string,
  type: 'income' | 'outcome',
  value: number,
  category: string
}

class ImportTransactionsService {
  async execute({ path }: DTO): Promise<Transaction[] | void> {

    const fileDestination = resolve(__dirname, '..', '..', 'tmp', 'uploads');
    const archive_path = fileDestination + '/' + path;
    const categoryRespository = getCustomRepository(CategoryRespository);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];


    const readStream = fs.createReadStream(archive_path)
    const readCSV = readStream.pipe(csv({
      from_line: 2
    }));

    readCSV.on('data', async line => {

      const [title, type, value, category] = line.map((cell: any) => cell.trim());

      if (!title || !type || !value || !category) return

      const transaction = {
        title,
        type,
        value,
        category,
      }
      categories.push(category);
      transactions.push(transaction);

    })

    await new Promise(resolve => readCSV.on('end', resolve));



    const ifExistsCategoryDatabase = await categoryRespository.find({
      where: In(categories)
    })

    const existentCategoriestitles = ifExistsCategoryDatabase.map(
      (category: Category) => category.title
    );

    const addCategoryTitle = categories
      .filter(category => !existentCategoriestitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index)

    const newCategories = categoryRespository.create(
      addCategoryTitle.map(title => ({
        title
      })),
    )

    await categoryRespository.save(newCategories);

    const finalCategories = [...newCategories, ...ifExistsCategoryDatabase]

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(category => category.title === transaction.category)
      }))
    )

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(archive_path);

    return createdTransactions;
  }

}

export default ImportTransactionsService;
