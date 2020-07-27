import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import TransactionRepository from './../repositories/TransactionsRepository';
import CategoryRespository from './../repositories/CategoryRespository';

interface TransactionDTO {
  title: string,
  value: number,
  type: 'income' | 'outcome',
  category: string,
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: TransactionDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getCustomRepository(CategoryRespository);


    if (!(['income', 'outcome'].includes(type))) {
      throw new AppError('Type should be income or outcome.', 400);
    }


    let isCategoryExists = await categoryRepository.findOne({
      where: {
        title: category.trim()
      }
    })

    if (!isCategoryExists) {
      isCategoryExists = await categoryRepository.create({ title: category });
      await categoryRepository.save(isCategoryExists);
    }


    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.income) {
      throw new AppError("It wasn't possible complete this action");
    }


    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category: isCategoryExists
    })

    await transactionRepository.save(transaction);

    return transaction;

  }
}

export default CreateTransactionService;
