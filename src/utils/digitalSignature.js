import crypto from "crypto"
import jwt from "jsonwebtoken"
import moment from "moment"

/**
 * Gera uma assinatura digital para um documento
 * @param {Object} document - Documento a ser assinado
 * @param {Object} user - Usuário que está assinando
 * @param {String} privateKey - Chave privada para assinatura (opcional, usa JWT_SECRET por padrão)
 * @returns {Object} - Objeto contendo informações da assinatura
 */
export const signDocument = (document, user, privateKey = process.env.JWT_SECRET) => {
  // Criar hash do conteúdo do documento
  const contentHash = crypto
    .createHash("sha256")
    .update(document._id.toString() + document.content + (document.conclusion || ""))
    .digest("hex")

  // Timestamp da assinatura
  const signatureDate = new Date()

  // Criar payload da assinatura
  const signaturePayload = {
    documentId: document._id.toString(),
    contentHash,
    signedBy: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    signatureDate: signatureDate.toISOString(),
  }

  // Assinar o payload
  const signatureToken = jwt.sign(signaturePayload, privateKey, { expiresIn: "100y" })

  // Retornar objeto de assinatura
  return {
    signedBy: user._id,
    signatureDate,
    signatureData: signatureToken,
    contentHash,
    verificationCode: generateVerificationCode(),
  }
}

/**
 * Verifica a autenticidade de uma assinatura digital
 * @param {Object} document - Documento assinado
 * @param {Object} signature - Assinatura digital
 * @param {String} publicKey - Chave pública para verificação (opcional, usa JWT_SECRET por padrão)
 * @returns {Object} - Resultado da verificação
 */
export const verifySignature = (document, signature, publicKey = process.env.JWT_SECRET) => {
  try {
    // Verificar se o documento possui assinatura
    if (!signature || !signature.signatureData) {
      return {
        valid: false,
        message: "Documento não possui assinatura digital",
      }
    }

    // Decodificar token de assinatura
    const decodedSignature = jwt.verify(signature.signatureData, publicKey)

    // Recalcular hash do conteúdo atual
    const currentContentHash = crypto
      .createHash("sha256")
      .update(document._id.toString() + document.content + (document.conclusion || ""))
      .digest("hex")

    // Verificar se o hash do conteúdo corresponde
    if (decodedSignature.contentHash !== currentContentHash) {
      return {
        valid: false,
        message: "O conteúdo do documento foi alterado após a assinatura",
        expectedHash: decodedSignature.contentHash,
        currentHash: currentContentHash,
      }
    }

    // Verificar se o ID do documento corresponde
    if (decodedSignature.documentId !== document._id.toString()) {
      return {
        valid: false,
        message: "A assinatura não corresponde a este documento",
      }
    }

    // Assinatura válida
    return {
      valid: true,
      signedBy: decodedSignature.signedBy,
      signatureDate: decodedSignature.signatureDate,
      age: moment(decodedSignature.signatureDate).fromNow(),
    }
  } catch (error) {
    return {
      valid: false,
      message: "Assinatura inválida ou corrompida",
      error: error.message,
    }
  }
}

/**
 * Gera um código de verificação para a assinatura
 * @returns {String} - Código de verificação
 */
const generateVerificationCode = () => {
  // Gerar código alfanumérico de 8 caracteres
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters.charAt(randomIndex)
  }

  return code
}

/**
 * Verifica um documento usando seu hash e código de verificação
 * @param {String} documentId - ID do documento
 * @param {String} hash - Hash do documento
 * @param {String} verificationCode - Código de verificação
 * @param {Object} document - Documento a ser verificado
 * @returns {Object} - Resultado da verificação
 */
export const verifyDocumentByHash = (documentId, hash, verificationCode, document) => {
  // Verificar se o documento existe
  if (!document) {
    return {
      valid: false,
      message: "Documento não encontrado",
    }
  }

  // Verificar se o documento está assinado
  if (!document.digitalSignature) {
    return {
      valid: false,
      message: "Documento não possui assinatura digital",
    }
  }

  // Verificar código de verificação
  if (document.digitalSignature.verificationCode !== verificationCode) {
    return {
      valid: false,
      message: "Código de verificação inválido",
    }
  }

  // Verificar hash do documento
  if (document.digitalSignature.contentHash !== hash) {
    return {
      valid: false,
      message: "O conteúdo do documento foi alterado após a assinatura",
    }
  }

  // Documento válido
  return {
    valid: true,
    document: {
      id: document._id,
      title: document.title,
      signedBy: document.digitalSignature.signedBy,
      signatureDate: document.digitalSignature.signatureDate,
      age: moment(document.digitalSignature.signatureDate).fromNow(),
    },
  }
}

export default {
  signDocument,
  verifySignature,
  verifyDocumentByHash,
}

