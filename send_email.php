<?php
// Define que a resposta será em formato JSON, para que seu JavaScript entenda.
header('Content-Type: application/json');

// Medida de segurança: apenas permite requisições do seu próprio domínio.
// Substitua 'www.inoutchi.com' pelo seu domínio exato, se for diferente.
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origin = 'https://www.inoutchi.com'; // Coloque seu domínio aqui
    if (strpos($_SERVER['HTTP_ORIGIN'], $allowed_origin) !== false) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    }
}

// Verifica se a requisição é do tipo POST, como esperado do formulário.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

// --- CONFIGURAÇÃO PRINCIPAL ---
$to = 'tiarlei@inoutchi.com'; // Seu novo e-mail de destino.
$subject = 'Novo Contato do Site Inoutchi';

// --- COLETA E LIMPEZA DOS DADOS DO FORMULÁRIO ---
// Usamos funções para limpar os dados e evitar problemas de segurança.
$name = isset($_POST['nome']) ? trim(strip_tags($_POST['nome'])) : '';
$email = isset($_POST['email']) ? trim(filter_var($_POST['email'], FILTER_SANITIZE_EMAIL)) : '';
$school = isset($_POST['escola']) ? trim(strip_tags($_POST['escola'])) : '';
$phone = isset($_POST['telefone']) ? trim(strip_tags($_POST['telefone'])) : '';
$message_content = isset($_POST['mensagem']) ? trim(strip_tags($_POST['mensagem'])) : '';

// --- VALIDAÇÃO DOS DADOS ---
if (empty($name) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($school)) {
    echo json_encode(['success' => false, 'error' => 'Nome, email e escola são campos obrigatórios.']);
    exit;
}

// --- MONTAGEM DO CORPO DO E-MAIL ---
$body = "Você recebeu uma nova solicitação de demonstração do site Inoutchi.\n\n";
$body .= "========================================\n";
$body .= "Nome: " . $name . "\n";
$body .= "Email: " . $email . "\n";
$body .= "Escola: " . $school . "\n";
$body .= "Telefone: " . $phone . "\n\n";
$body .= "Mensagem:\n";
$body .= "----------------------------------------\n";
$body .= $message_content . "\n";
$body .= "========================================\n";

// --- CABEÇALHOS DO E-MAIL ---
// O cabeçalho 'Reply-To' é um truque profissional: permite que você clique em "Responder"
// no seu cliente de e-mail e a resposta vá direto para o e-mail de quem preencheu o formulário.
$headers = 'From: no-reply@inoutchi.com' . "\r\n" .
           'Reply-To: ' . $email . "\r\n" .
           'X-Mailer: PHP/' . phpversion();

// --- ENVIO DO E-MAIL ---
// A função mail() é padrão na Hostinger e deve funcionar diretamente.
if (mail($to, $subject, $body, $headers)) {
    // Se o envio for bem-sucedido, retorna um JSON de sucesso.
    echo json_encode(['success' => true]);
} else {
    // Se falhar, retorna um JSON de erro.
    echo json_encode(['success' => false, 'error' => 'O servidor não conseguiu enviar o e-mail.']);
}

exit;
?>
