class Sql {

  static execute(comando) {
    //Tratamento comando
    comando = comando.trim().replace(/\n/g, '').replace(/\s\s+/g, '').replace(/create\s+/gi, 'create ');
    comando = comando.replaceAll('getdate()', this.getdate());

      // console.log(comando)
    comando = comando.split(';');

    comando = comando.filter(valor => valor.trim() !== '');

    /*Funções*/

  //   console.log(comando)

    /*REGEX*/
    /*Funcões*/
    const leftRegex = /left\((.*?)(?:\|(\d+))?\)/;

    /*Comandos*/
    const linhasRegex = /insert\s+into\s+(\w+)\s+values\(([\s\S]+)\)/gi;
  //   const selectAllRegex = /select\s+\*\s+from\s+(\w+)/gi;
    const selectAllRegex = /select\s+\*\s+from\s+(\w+)\s*(?!\w*(?:join)\w*)\s*(on table (?:html|json))?/
    const selectColumnsRegex = /select\s+([\w\s,]+)\s+from\s+(\w+)\s*(?!.*\bjoin\b)\s*(on table (?:html|json))?/gi;
    const dropTableRegex = /drop\s+table\s+(\w+)/gi;
  //   const updateRegex = /update\s+(\w+)\s+set\s+(\w+)\s*=\s*([^ ]+)\s+where\s+(\w+)\s*=\s*([^ ]+)/gi;
    const updateRegex = /update\s+(\w+)\s+set\s+(\w+)\s*=\s*("[^"]+"|'[^']+'|[^ ]+)\s+where\s+(\w+)\s*=\s*("[^"]+"|'[^']+'|[^ ]+)/gi;
    const deleteRegex = /delete\s+from\s+(\w+)\s+where\s+(\w+)\s*=\s*([^ ]+)/gi;
    const createTableRegex = /create\s+table\s+(\w+)\s*\(([\s\S]+)\)/gi;
    const createTableIfNotExistRegex = /^\s*CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)\s*\(([^)]+)\)\s*;?\s*$/i

  //   const joinRegex = /select\s+(.*)\s+from\s+(\w+)\s+join\s+(\w+)\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
    const SelectjoinRegex = /select\s+(.*)\s+from\s+((?:\w+\s*,\s*)*\w+)\s+((?:join\s+\w+\s+on\s+\w+\.\w+\s*=\s*\w+\.\w+\s*)+)(on table (?:html|json))?/gi;
    const joinRegex = /join\s+([\w,]+)\s+on\s+([\w]+\.[\w]+)\s*=\s*([\w]+\.[\w]+)/gi;

  /*FUNÇÕES*/
  let match;
  let result;

  /*COMANDOS*/
  // console.log(comando.length)
  for(let i = 0; i < comando.length; i++){
  console.log(comando[i])
  let error = 1;

  if (comando[i].startsWith('#')) {
    continue;
  }

  /*CREATE TABLE*/
    match = createTableRegex.exec(comando[i]);
    createTableRegex.exec(comando[i]);
    if (match) {
      const nome = match[1];
      const colunas = match[2].split(",").map(c => c.trim());
      this.createTable(nome, colunas);
      error=0;
    }

    /*CREATE TABLE IF NOT EXISTS*/
    match = createTableIfNotExistRegex.exec(comando[i]);
    createTableIfNotExistRegex.exec(comando[i]);
    if(match){
      // console.log(match)
      const nome = match[1];
      const colunas = match[2].split(",").map(c => c.trim());
      this.createTableifnotexist(nome, colunas);
      error=0;

    }

    /*INSERT INTO TABLE VALUES*/
    match = linhasRegex.exec(comando[i]);
    linhasRegex.exec(comando[i]);
    if (match) {
      const nome = match[1];
      const valores = match[2].split(",").map(v => v.trim());
      
      const colunas = JSON.parse(localStorage.getItem(`${nome}-colunas`));

      if (valores.length < colunas.length) {
          const autoColuna = colunas.find(c => c.includes('auto_increment'));
          if (autoColuna) {
            const autoIndex = colunas.indexOf(autoColuna);
            const autoId = this.getNextId(nome);
            valores.splice(autoIndex, 0, autoId);
          } else {
            console.error(`Valores incompletos para colunas: ${colunas.join(', ')}`);
          }
        }        
      this.inserir(nome, valores);
      error=0;
    }

    
  /*SELECT COM JOIN*/
  match = SelectjoinRegex.exec(comando[i]);
  SelectjoinRegex.exec(comando[i]);
  if (match) {
    // console.log(match)
    const tables = [];
    const joins = [];    
    const fields = [];    
    const columns = match[1].split(',').map(c => c.trim());
    console.log(match[4])
    const type = match[4] 

    /*Função Left com Join*/
    for (let col of columns) {
      const match = col.match(leftRegex);
      if (match) {
        const fieldName = match[1];
        const fieldSize = match[2];
        fields.push({ name: fieldName, size: fieldSize });
      }
    }

    // console.log(fields)

    tables.push(match[2]);
   //console.log(match)
      
    for (match of comando[i].matchAll(joinRegex)) {
      const join = {};
      tables.push(match[1]);
      join.column1 = match[2];
      join.column2 = match[3];
      joins.push(join);
    }
  //   console.log("tables"+tables);
  //   console.log(joins);
  //  this.join(tables, columns, joins)
    result = this.join(tables, columns, joins,fields, type)
    error = 0;
    return result;
   }

   /* SELECT COM * */
    match = selectAllRegex.exec(comando[i]);
    selectAllRegex.exec(comando[i]);
    if (match) {
      // console.log("Passei aqui")
      const nome = match[1];
      const type = match[2];
      console.log(match)
      const result=this.select(nome,null,type);

      return result;

      error=0;
    }

    /* SELECT COM COLUNAS */
    match = selectColumnsRegex.exec(comando[i]);
    selectColumnsRegex.exec(comando[i]);
    if (match) {
      const colunas = match[1].split(",").map(c => c.trim());
      const nome = match[2];
      const type = match[3];
      const result = this.select(nome, colunas, type);
      return result;
      error=0;
    }

    /* DROP TABLE */
    match = dropTableRegex.exec(comando[i]);
    dropTableRegex.exec(comando[i]);
    if (match) {
      const nome = match[1];
      this.drop(nome);
      error=0;
    }

    /* UPDATE TABLE */
    match = updateRegex.exec(comando[i]);
    updateRegex.exec(comando[i]);
    if (match) {
      const nome = match[1];
      const coluna = match[2];
      const valor = match[3];
      const whereColuna = match[4];
      const whereValor = match[5];
      this.update(nome, coluna, valor, whereColuna, whereValor);
      error=0;
    }

    /* DELETE TABLE */
    match = deleteRegex.exec(comando[i]);
    if (match) {
      const nome = match[1];
      const whereColuna = match[2];
      const whereValor = match[3];
      this.delete(nome, whereColuna, whereValor);
      error=0;
    }

    if(error==1){
      console.error(` Comando inválido '${comando[i]}'`);
    }
  }
}

/*Funções para a interpretação em javascript*/
  /*Funções*/
  static left(campo, tamanho) {
    return campo.substring(0, tamanho);
  }


  static getdate() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  
  static createTable(nomeTabela, colunas) {
      localStorage.setItem(nomeTabela, "[]");
      localStorage.setItem(`${nomeTabela}-colunas`, JSON.stringify(colunas));
    }

    static createTableifnotexist(nomeTabela, colunas) {
      const tabelaExistente = JSON.parse(localStorage.getItem(nomeTabela));
      if (tabelaExistente) {
        return; // tabela já existe, não é necessário criar novamente
      }
      localStorage.setItem(nomeTabela, "[]");
      localStorage.setItem(`${nomeTabela}-colunas`, JSON.stringify(colunas));
    }
    

  static inserir(nome, valores) {
    const colunas = JSON.parse(localStorage.getItem(`${nome}-colunas`));
    const linha = {};
    for (let i = 0; i < colunas.length; i++) {
      linha[colunas[i]] = valores[i];
    }
    const linhas = JSON.parse(localStorage.getItem(nome)) || [];
    linhas.push(linha);
    localStorage.setItem(nome, JSON.stringify(linhas));
  }

  static getNextId(nome) {
      const linhas = JSON.parse(localStorage.getItem(nome)) || [];
      const autoColuna = JSON.parse(localStorage.getItem(`${nome}-colunas`)).find(c => c.includes('auto_increment'));
      if (autoColuna) {
        const autoId = linhas.length > 0 ? parseInt(linhas[linhas.length - 1][autoColuna]) + 1 : 1;
        return autoId;
      }
    }

static join(tables, columns, joins,fields, type) {
  let data = null;
  let tableIndex = 0;
  let column_increment = null;

  for (const table of tables) {
      const tableData = JSON.parse(localStorage.getItem(table));
      console.log(tableData)
      if (data === null) {
          data = tableData;
      } else {
          const join = joins[tableIndex - 1];
          const joinColumn1 = join.column1.split(".")[1];
          const joinColumn2 = join.column2.split(".")[1]+' auto_increment';

          // console.log(joinColumn2)

          data = data.flatMap(row1 => {
              return tableData.filter(row2 => row1[joinColumn1] == row2[joinColumn2])
                  .map(row2 => Object.assign({}, row1, row2));
          });
      }
      tableIndex++;
  }

  console.log(data)
  const result = data.map(row => {
      const obj = {};
      for (const column of columns) {
          console.log("Columns:"+column)
          // console.log("fields name"+fields[0].name)
          // for(const field of fields){
            // console.log("field"+field)
            // if(column.includes(field.name)){
                // console.log("Includesx"+column)
                // obj[field.name] = row[field.name].slice(0,5);
            // }else{
              // console.log("obj"+obj[column])
              if(row[column]){
                // console.log(obj[column])
                obj[column] = row[column];
              }
           
            // }
          // }
        
      }
      return obj;
  });

  // console.log(result)
  if(type == 'on table html'){
    const table = document.createElement('table');
    table.classList.add('table')
    table.classList.add('table-dark')
    
    // console.log(result[1])
  
    const headerRow = document.createElement('tr');
    for (const column in result[0]) {
      // console.log("Cabeçalho"+column)
      const headerCell = document.createElement('th');
      headerCell.textContent = column
      headerRow.appendChild(headerCell);
    }
    table.appendChild(headerRow);
  
    for (const item of result) {
      const row = document.createElement('tr');
      for (const column in item) {
        const cell = document.createElement('td');
        cell.textContent = item[column];
        row.appendChild(cell);
            
        if (column.includes('auto_increment')) {
          column_increment = column
        }



      }
      table.appendChild(row);
      const excluirCell = document.createElement('td');
      const excluirButton = document.createElement('button');
      excluirButton.classList.add('btn', 'btn-danger');
      excluirButton.id = 'delete';
      excluirButton.textContent = 'Excluir';
      excluirButton.setAttribute('data-id', item[column_increment]);

      excluirCell.appendChild(excluirButton);
      row.appendChild(excluirCell);
    }


    // 
    
    document.body.appendChild(table);
  }
 
  return result;
}
  
static selectjson(nome, colunas) {
  const linhas = JSON.parse(localStorage.getItem(nome)) || [];
  let result;
  
  if (colunas) {
    result = linhas.map(linha => {
      const novaLinha = {};
      for (let i = 0; i < colunas.length; i++) {
        novaLinha[colunas[i]] = linha[colunas[i]];
      }
      return novaLinha;
    });
    return result;
  } else {
    result = linhas;
    return result;
  }
}

static select(nome, colunas, type) {
  const linhas = JSON.parse(localStorage.getItem(nome)) || [];
  let result;
  
  if (colunas) {
    result = linhas.map(linha => {
      const novaLinha = {};
      for (let i = 0; i < colunas.length; i++) {
        novaLinha[colunas[i]] = linha[colunas[i]];
      }
      return novaLinha;
    });
  } else {
    result = linhas;
  }
  console.log('here'+type)
  if(type == 'on table html'){
    const table = document.createElement('table');
    table.classList.add('table')
    table.classList.add('table-dark')
    
    const headerRow = document.createElement('tr');
    for (const column in result[0]) {
      const headerCell = document.createElement('th');
      headerCell.textContent = column;
      headerRow.appendChild(headerCell);
    }
    
    const enviarCellHeader = document.createElement('th');
    enviarCellHeader.textContent = "Enviar";
    headerRow.appendChild(enviarCellHeader);
    
    const editarCellHeader = document.createElement('th');
    editarCellHeader.textContent = "Editar";
    headerRow.appendChild(editarCellHeader);
    
    const excluirCellHeader = document.createElement('th');
    excluirCellHeader.textContent = "Excluir";
    headerRow.appendChild(excluirCellHeader);
    
    table.appendChild(headerRow);
    let column_increment = null;
    
    for (const item of result) {
    
      const row = document.createElement('tr');
      for (const column in item) {
        const cell = document.createElement('td');
        cell.textContent = item[column];
        cell.setAttribute('data-coluna', column);
        row.appendChild(cell);
    
        if (column.includes('auto_increment')) {
          column_increment = column
        }
    
      }
    
      /* BOTÃO EDITAR */
      const editarCell = document.createElement('td');
      const editarButton = document.createElement('button');
      editarButton.classList.add('btn', 'btn-warning');
      editarButton.textContent = 'Editar';
      editarButton.id = 'editar';
      editarButton.setAttribute('data-id', item[column_increment]);
    
      /* BOTÃO ENVIAR */
      const enviarCell = document.createElement('td');
      const enviarButton = document.createElement('button');
      enviarButton.classList.add('btn', 'btn-primary');
      enviarButton.textContent = 'Enviar';
      enviarButton.id = 'enviar';
      enviarCell.appendChild(enviarButton);
      row.appendChild(enviarCell);
      enviarButton.setAttribute('data-id', item[column_increment]);
    
      editarCell.appendChild(editarButton);
      row.appendChild(editarCell);
    
      /* BOTÃO EXCLUIR */
      const excluirCell = document.createElement('td');
      const excluirButton = document.createElement('button');
      excluirButton.classList.add('btn', 'btn-danger');
      excluirButton.textContent = 'Excluir';
      excluirButton.id = 'delete';
      excluirCell.appendChild(excluirButton);
      excluirButton.setAttribute('data-id', item[column_increment]);
      row.appendChild(excluirCell);
    
      table.appendChild(row);
    }  
    document.body.appendChild(table);
  }
  
  return result

}

  static drop(nome) {
  localStorage.removeItem(nome);
  localStorage.removeItem(`${nome}-colunas`);
}

static update(nome, coluna, valor, condicaoColuna, condicaoValor) {
  const linhas = JSON.parse(localStorage.getItem(nome)) || [];
  for (let i = 0; i < linhas.length; i++) {
    //Tratamento auto_increment
    if(!linhas[i][condicaoColuna]){
      condicaoColuna=condicaoColuna+' auto_increment'
    }
  //   console.log(condicaoColuna)
  //   console.log("Linhas:" +linhas[i][condicaoColuna])
    if (linhas[i][condicaoColuna] == condicaoValor) {
      linhas[i][coluna] = valor;
      // console.log("Coluna"+linhas[i][coluna])
      // console.log(valor);
    }
  //   console.log(linhas)
  }
  localStorage.setItem(nome, JSON.stringify(linhas));
}

static delete(nome, condicaoColuna, condicaoValor) {
  let linhas = JSON.parse(localStorage.getItem(nome)) || [];

  if(!linhas[condicaoColuna]){
    condicaoColuna=condicaoColuna+' auto_increment'
  }

  linhas = linhas.filter(linha => linha[condicaoColuna] != condicaoValor);
  localStorage.setItem(nome, JSON.stringify(linhas));
}


}
