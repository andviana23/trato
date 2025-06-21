-- Verificar estrutura da tabela profissionais
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profissionais';
-- Verificar estrutura da tabela barber_queue
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'barber_queue';
-- Verificar se o trigger existe
SELECT trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profissionais';
-- Listar todos os profissionais que são barbeiros
SELECT p.id,
    p.nome,
    p.funcao,
    p.created_at
FROM profissionais p
WHERE p.funcao = 'barbeiro';
-- Listar todos os registros da fila
SELECT bq.*,
    p.nome as nome_barbeiro,
    p.funcao
FROM barber_queue bq
    LEFT JOIN profissionais p ON p.id = bq.profissional_id;
-- Verificar barbeiros que estão na tabela profissionais mas não estão na fila
SELECT p.id,
    p.nome,
    p.funcao
FROM profissionais p
    LEFT JOIN barber_queue bq ON bq.profissional_id = p.id
WHERE p.funcao = 'barbeiro'
    AND bq.id IS NULL;
-- Verificar registros na fila que não têm profissional correspondente
SELECT bq.*
FROM barber_queue bq
    LEFT JOIN profissionais p ON p.id = bq.profissional_id
WHERE p.id IS NULL;