import type { NextApiRequest, NextApiResponse } from "next";
import { politicaCORS } from "../../../middlewares/politicaCORS";
import { validarTokenJWT } from "../../../middlewares/validarTokenJWT";
import { conectarMongoDB } from "../../../middlewares/conectarMongoDB";
import { RespostaPadraoMsg } from "../../../types/RespostaPadraoMsg";
import { UsuarioModel } from "../../../models/UsuarioModel";
import { SeguidorModel } from "../../../models/SeguidorModel";



const pesquisaEndpoint = async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg | any[]>) => {
    try {
        if(req.method === "GET"){ // Verificando o método HTTP do request caso seja algo diferente de GET retornará que o método não é válido
            if(req?.query?.id){ // Verifica se há um request e se esse request possui uma propriedade id. Esse caso é para uma pesquisa por ID
                const usuarioEncontrado = await UsuarioModel.findById(req?.query?.id); // Busca na DB o usuário usando o id
                usuarioEncontrado.senha = null; // Define a senha do usuário como Null pra não ficar trafegando a senha do usuário
                if(!usuarioEncontrado){ // Caso não retorne um usuário retorna um erro de usuário não encontrado
                    return res.status(400).json({erro: 'Usuário não encontrado'})
                }
                const user = {
                    senha: null,
                    segueEsseUsuario: false,
                    nome: usuarioEncontrado.nome,
                    email: usuarioEncontrado.email,
                    _id: usuarioEncontrado._id,
                    avatar: usuarioEncontrado.avatar,
                    seguidores: usuarioEncontrado.seguidores,
                    seguindo: usuarioEncontrado.seguindo,
                    publicacoes: usuarioEncontrado.publicacoes,
                } as any;

                const segueEsseUsuario = await SeguidorModel.find({ usuarioId: req?.query?.userID, usuarioSeguidoId: usuarioEncontrado._id });
                if (segueEsseUsuario && segueEsseUsuario.length > 0) {
                    user.segueEsseUsuario = true;
                }
                return res.status(200).json(user); // Retorna o usuário encontrado pelo id
            }else{ // Caso não seja passado nenhum id pelo query faremos a busca pelo filtro
                const {filtro} = req.query; // Usando um destructor pegamos a propriedade filtro da query da request

                if(!filtro || filtro.length < 2){ // Caso não haja filtro ou o filtro tenha menos de 2 caracteres retorna um erro pedindo pra informar pelo menos 2 caracteres
                    return res.status(400).json({erro: 'Favor informar pelo menos 2 caracteres para a busca'})
                }

                const usuariosEncontrados = await UsuarioModel.find({ // Busca na DB conforme o filtro
                    $or: [ // Passando mais de um parametro para a busca
                        {nome : {$regex : filtro, $options: 'i'}}, // Pesquisa pelo nome usando o options i para ignorar o case sensitive
                        {email : {$regex : filtro, $options: 'i'}} // Pesquisa pelo email usando o options i para ignorar o case sensitive
                    ]
                    
                });

                usuariosEncontrados.forEach(userFound => {
                    userFound.senha = null
                });

                return res.status(200).json(usuariosEncontrados) ; // Retorna os usuário encontrados pelo DB
            }


            

        }
        
    } catch (e) { // Caso encontre algum erro imprime o erro no console
        console.log(e);
        return res.status(500).json({erro: 'Não foi possível buscar usuários: ' + e})
    }
}

export default politicaCORS(validarTokenJWT(conectarMongoDB(pesquisaEndpoint))); // Exporta o endpoint de pesquisa passando pelos middlewares necessários