import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface DTO {
  id: string
}
class DeleteTransactionService {
  public async execute({ id }: DTO): Promise<void> {
    const transactionRepository = await getCustomRepository(TransactionsRepository);

    const isTransactionExists = await transactionRepository.findOne({ where: { id } });

    if (!isTransactionExists) {
      throw new AppError('Transaction with this id do not exists', 404);
    }

    await transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;
