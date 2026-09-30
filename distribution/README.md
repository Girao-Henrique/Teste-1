# Arquivos para distribuição

`android/Paradise-Android.apk` é o APK assinado para a versão de teste 1.0.0. As chaves privadas continuam fora do repositório. O hash acompanha o arquivo para validar o envio pelo GitHub Actions.

O workflow manual `.github/workflows/publicar-aplicativos.yml` gera o executável em Windows, executa os testes e anexa ambos à release de teste previamente preparada. Ele não compila nem reassina o APK: para atualizar o Android, gere a versão local com a mesma chave privada e substitua o APK e seu hash.
