CREATE TABLE IF NOT EXISTS escolas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  nif VARCHAR(30),
  endereco VARCHAR(255),
  telefone VARCHAR(30),
  email VARCHAR(150),
  config_recibo JSONB NOT NULL DEFAULT '{}',
  estado VARCHAR(20) NOT NULL DEFAULT 'Ativa'
    CHECK (estado IN ('Ativa', 'Suspensa')),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Para bases já existentes (produção), criadas antes desta coluna existir:
ALTER TABLE escolas ADD COLUMN IF NOT EXISTS config_recibo JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'secretaria'
    CHECK (role IN ('super_admin', 'admin', 'secretaria', 'professor')),
  escola_id INT REFERENCES escolas(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'Ativo'
    CHECK (estado IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome VARCHAR(30) NOT NULL,
  ano_lectivo VARCHAR(9) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (escola_id, nome, ano_lectivo)
);

CREATE TABLE IF NOT EXISTS professores (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  sexo VARCHAR(20),
  data_nascimento DATE,
  contacto VARCHAR(30),
  email VARCHAR(150),
  endereco VARCHAR(255),
  especialidade VARCHAR(100),
  estado VARCHAR(20) NOT NULL DEFAULT 'Ativo'
    CHECK (estado IN ('Ativo', 'Inativo', 'Licença', 'Afastado')),
  data_contratacao DATE,
  formacao VARCHAR(255),
  experiencia VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (escola_id, codigo)
);

CREATE TABLE IF NOT EXISTS professor_disciplinas (
  id SERIAL PRIMARY KEY,
  professor_id INT NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplina VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS professor_classes (
  id SERIAL PRIMARY KEY,
  professor_id INT NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  classe VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS turmas (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  nome VARCHAR(10) NOT NULL,
  classe_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  turno VARCHAR(20) NOT NULL,
  sala VARCHAR(50),
  professor_responsavel_id INT REFERENCES professores(id) ON DELETE SET NULL,
  capacidade_maxima INT NOT NULL DEFAULT 30,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (classe_id, nome)
);

CREATE TABLE IF NOT EXISTS professor_turmas (
  id SERIAL PRIMARY KEY,
  professor_id INT NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  turma_id INT NOT NULL REFERENCES turmas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  sexo VARCHAR(20),
  data_nascimento DATE,
  bi VARCHAR(30),
  contacto VARCHAR(30),
  email VARCHAR(150),
  encarregado VARCHAR(150),
  contacto_encarregado VARCHAR(30),
  email_encarregado VARCHAR(150),
  parentesco VARCHAR(30),
  turma_id INT REFERENCES turmas(id) ON DELETE SET NULL,
  classe_id INT REFERENCES classes(id) ON DELETE SET NULL,
  ano_lectivo VARCHAR(9),
  estado VARCHAR(20) NOT NULL DEFAULT 'Ativo'
    CHECK (estado IN ('Ativo', 'Inativo', 'Transferido', 'Concluído')),
  data_matricula DATE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (escola_id, codigo),
  UNIQUE (escola_id, bi)
);

CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos USING gin (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_alunos_codigo ON alunos (codigo);
CREATE INDEX IF NOT EXISTS idx_alunos_turma ON alunos (turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_escola ON alunos (escola_id);

CREATE TABLE IF NOT EXISTS documentos_aluno (
  id SERIAL PRIMARY KEY,
  aluno_id INT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  aluno_id INT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(12,2) NOT NULL,
  valor_base NUMERIC(12,2),
  multa NUMERIC(12,2) NOT NULL DEFAULT 0,
  propina_mensal NUMERIC(12,2),
  meses_selecionados TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pago', 'Pendente', 'Confirmado', 'Cancelado')),
  tipo VARCHAR(50) DEFAULT 'Propina',
  forma_pagamento VARCHAR(30) DEFAULT 'Dinheiro',
  referencia VARCHAR(100),
  funcionario VARCHAR(100),
  mes_referencia VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos (data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);

-- Para bases já existentes (produção) que criaram a tabela antes destas colunas existirem:
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_base NUMERIC(12,2);
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS multa NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS propina_mensal NUMERIC(12,2);
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS meses_selecionados TEXT[];

CREATE TABLE IF NOT EXISTS historico_aluno (
  id SERIAL PRIMARY KEY,
  aluno_id INT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  acao VARCHAR(150) NOT NULL,
  detalhes TEXT
);

CREATE TABLE IF NOT EXISTS matriculas (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  numero VARCHAR(30) NOT NULL,
  aluno_id INT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  ano_lectivo VARCHAR(9) NOT NULL,
  classe_id INT REFERENCES classes(id) ON DELETE SET NULL,
  turma_id INT REFERENCES turmas(id) ON DELETE SET NULL,
  turno VARCHAR(20),
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  taxa_matricula NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado_pagamento VARCHAR(20) NOT NULL DEFAULT 'Pago'
    CHECK (estado_pagamento IN ('Pago', 'Pendente', 'Parcial')),
  estado VARCHAR(20) NOT NULL DEFAULT 'Ativa'
    CHECK (estado IN ('Ativa', 'Cancelada')),
  data_renovacao DATE,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (escola_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_matriculas_aluno ON matriculas (aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_estado ON matriculas (estado);
CREATE INDEX IF NOT EXISTS idx_matriculas_escola ON matriculas (escola_id);

CREATE TABLE IF NOT EXISTS matricula_transferencias (
  id SERIAL PRIMARY KEY,
  matricula_id INT NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  de_turma VARCHAR(10),
  para_turma VARCHAR(10),
  motivo TEXT
);

CREATE TABLE IF NOT EXISTS confirmacoes (
  id SERIAL PRIMARY KEY,
  escola_id INT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  aluno_id INT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  matricula_id INT REFERENCES matriculas(id) ON DELETE SET NULL,
  ano_lectivo_anterior VARCHAR(9),
  novo_ano_lectivo VARCHAR(9) NOT NULL,
  nova_classe VARCHAR(30),
  nova_turma VARCHAR(10),
  periodo VARCHAR(20),
  valor_mensalidade NUMERIC(12,2),
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendente'
    CHECK (estado IN ('Pendente', 'Confirmado', 'Rejeitado')),
  observacoes TEXT,
  data_solicitacao TIMESTAMP NOT NULL DEFAULT now(),
  data_confirmacao TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comunicados (
  id SERIAL PRIMARY KEY,
  escola_id INT REFERENCES escolas(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  conteudo TEXT,
  destinatario VARCHAR(50) DEFAULT 'Todos',
  status VARCHAR(20) NOT NULL DEFAULT 'Publicado'
    CHECK (status IN ('Rascunho', 'Publicado')),
  icon VARCHAR(60),
  badge VARCHAR(50),
  badge_type VARCHAR(30),
  lido BOOLEAN NOT NULL DEFAULT false,
  data TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actividades (
  id SERIAL PRIMARY KEY,
  escola_id INT REFERENCES escolas(id) ON DELETE CASCADE,
  icon VARCHAR(60),
  texto VARCHAR(255) NOT NULL,
  badge VARCHAR(50),
  badge_type VARCHAR(30),
  data TIMESTAMP NOT NULL DEFAULT now()
);
