import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import multerConfig from '../config/multer';

const transactionsRouter = Router();

const upload = multer(multerConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionRepository.find({ relations: ['category'] });
  const balance = await transactionRepository.getBalance();

  return response.json({
    transactions,
    balance
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const transactionService = new CreateTransactionService();
  const transaction = await transactionService.execute({ title, value, type, category });
  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const deleteTransactionService = new DeleteTransactionService();

  const { id } = request.params;
  await deleteTransactionService.execute({ id });
  return response.send();

});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const { filename: path } = request.file;

  const importTransactionsService = new ImportTransactionsService();

  const transactions = await importTransactionsService.execute({ path });

  return response.json(transactions);
});

export default transactionsRouter;
