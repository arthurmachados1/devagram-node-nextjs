import type { NextApiRequest, NextApiResponse} from "next";
import {conectarMongoDB} from '../../../middlewares/conectarMongoDB';
import { RespostaPadraoMsg } from "../../../types/RespostaPadraoMsg";
import { LoginResposta } from "../../../types/LoginResposta";
import md5 from "md5";
import { UsuarioModel } from "../../../models/UsuarioModel";
import jwt from "jsonwebtoken";
import { politicaCORS } from "../../../middlewares/politicaCORS";

const endpointLogin = async (
    req: NextApiRequest,
    res: NextApiResponse<RespostaPadraoMsg | any>
  ) => { // Declaração padrão conforme os outros endpoints
    const { MINHA_CHAVE_JWT } = process.env; // Usando um destructor pega a chave JWT nas variáveis de ambiente
    if (!MINHA_CHAVE_JWT) { // Caso não exista uma chave retorna um erro de chave não informada
      return res.status(500).json({ erro: "ENV JWT não informada" });
    }
  
    if (req.method === "POST") { // Verifica se o método HTTP é POST, caso não seja retorna um erro de método inválido
      const { login, senha } = req.body; // Usando um destructor pega as propriedades login e senha do corpo da requisição
      
      const usuariosEncontrados = await UsuarioModel.find({ // Procura na base de dados o usuário passando um JSON com email(login) e senha. Criptografando a senha, para evitar de trafegar a senha do usuário sem criptografia
        email: login,
        senha: md5(senha),
      });
      if (usuariosEncontrados && usuariosEncontrados.length > 0) { // Caso a base de Dados retorne alguma coisa e o objeto retornado não seja vazio significa que o usuário foi encontrado e faremos a trativa de login
        const usuarioEncontrado = usuariosEncontrados[0]; // Pegamos o primeiro objeto retornado
  
        const token = jwt.sign({ id: usuarioEncontrado._id }, MINHA_CHAVE_JWT); // Geramos um Token JWT único para esse usuário
  
        return res.status(200).json({ // Retornamos um status de sucesso e o nome, email e token do usuário logado
          nome: usuarioEncontrado.nome,
          email: usuarioEncontrado.email,
          token,
        });
      }
      return res.status(404).json({ erro: "Usuário ou senha não encontrado" }); // Caso a DB não retorne nada e/ou o retorno seja vazio um erro de usuário e senha não encontrado é retornado
    }
    return res.status(405).json({ erro: "Metodo informado não é válido" });
  };
  
  export default politicaCORS(conectarMongoDB(endpointLogin)); // Exporta o endpoint de like passando pelos middlewares necessários