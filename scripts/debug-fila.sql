-- 1. Estrutura da tabela profissionais
SELECT column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profissionais'
ORDER BY ordinal_position;
-- 2. Estrutura da tabela barber_queue
SELECT column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'barber_queue'
ORDER BY ordinal_position;
-- 3. Exemplo de dados da tabela profissionais
SELECT *
FROM profissionais
LIMIT 5;
-- 4. Exemplo de dados da tabela barber_queue
SELECT *
FROM barber_queue
LIMIT 5;
-- 5. Verificar a relação entre as tabelas
SELECT p.id as prof_id,
    p.nome,
    p.funcao,
    p.telefone,
    bq.id as queue_id,
    bq.profissional_id,
    bq.queue_position,
    bq.is_active
FROM profissionais p
    LEFT JOIN barber_queue bq ON bq.profissional_id = p.id
WHERE p.funcao = 'barbeiro';
-- 6. Verificar as chaves estrangeiras
SELECT tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('profissionais', 'barber_queue');