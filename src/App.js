import React, { useState, useEffect } from 'react';
import '../src/App.css'





const Desafios = () => {

 

  const [Desafios, setDesafios] = useState([]);
  const [nome, setNome] = useState('');
  const [area, setArea] = useState('');

  useEffect(() => {
    // Carregar a lista de desafios do Local Storage ao inicializar o componente
    const storedDesafios = JSON.parse(localStorage.getItem('Desafios'));
    if (storedDesafios) {
      setDesafios(storedDesafios);
    }
  }, []);

  useEffect(() => {
    // Atualizar o Local Storage sempre que a lista de desafios for alterada
    localStorage.setItem('Desafios', JSON.stringify(Desafios));
  }, [Desafios]);

  const adicionardesafio = () => {
    // Adicionar um novo desafio à lista
    if (nome.trim() === '' || area.trim() === '') {
      return;
    }
    const ndesafio = { nome, area };
    const attDesafios = [...Desafios, ndesafio];
    setDesafios(attDesafios);
    setNome('');
    setArea('');
  };

  const editardesafios = (index, attnome, attarea) => {
    // Atualizar os dados de um desafio existente
    const attDesafios = [...Desafios];
    attDesafios[index] = { nome: attnome, area: attarea };
    setDesafios(attDesafios);
  };

  const deleteChallenge = (index) => {
    // Remover um desafio da lista
    const attDesafios = Desafios.filter((_, i) => i !== index);
    setDesafios(attDesafios);
  };

  return (
    <div>
      
      <h1>CRUD de Desafios</h1>
    
      <div>
              <a>nome desafio:  </a>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do desafio"
              />
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Área do desafio"
              />
              <button onClick={adicionardesafio}>Adicionar</button>
            </div>
            <br></br>
      <ul>
        {Desafios.map((desafios, index) => (
          <li key={index}>
            <span>nome desafio:{desafios.nome}</span>
            <span>area desafio:{desafios.area}</span>
            <button onClick={() => deleteChallenge(index)}>Excluir</button>
            <button id="abrir-modal"            
              onClick={() =>
                
                editardesafios(index, `${desafios.nome}`,`` ,`${desafios.area}`,)
                
              }
              
           >
              
              editar
            </button>
            <hr></hr>
          </li>
        ))}
      </ul>
    </div>
  );
};


export default Desafios;
