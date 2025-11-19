# Настройка Secrets для Kubernetes

## 🔒 Важно!

Перед развертыванием в production **обязательно** измените значения секретов!

## Создание Secrets

### Вариант 1: Используя манифест (для разработки)

```bash
# Применить secrets.yaml (НЕ для production!)
kubectl apply -f k8s/secrets.yaml
```

⚠️ **Внимание**: Файл `secrets.yaml` содержит дефолтные значения и НЕ должен использоваться в production!

### Вариант 2: Создание секретов вручную (рекомендуется для production)

```bash
# Создать secret с реальными значениями
kubectl create secret generic rss-secrets \
  --from-literal=jwt-secret='YOUR_STRONG_JWT_SECRET_HERE' \
  --from-literal=db-password='YOUR_STRONG_DB_PASSWORD_HERE' \
  --from-literal=db-user='postgres'
```

## Генерация сильных секретов

### JWT Secret (минимум 32 символа)

```bash
# Генерация случайного JWT secret
openssl rand -base64 32
```

### Database Password

```bash
# Генерация сильного пароля БД
openssl rand -base64 24
```

## Проверка секретов

```bash
# Проверить что secret создан
kubectl get secrets rss-secrets

# Посмотреть содержимое (base64 encoded)
kubectl get secret rss-secrets -o yaml

# Декодировать значение
kubectl get secret rss-secrets -o jsonpath='{.data.jwt-secret}' | base64 -d
```

## Production рекомендации

1. **НЕ коммитьте** реальные секреты в Git
2. **Используйте** системы управления секретами:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
3. **Ротация секретов** - меняйте секреты регулярно
4. **RBAC** - ограничьте доступ к секретам через Kubernetes RBAC
5. **Шифрование at rest** - включите encryption at rest для etcd

## Обновление секретов

```bash
# Удалить старый secret
kubectl delete secret rss-secrets

# Создать новый
kubectl create secret generic rss-secrets \
  --from-literal=jwt-secret='NEW_JWT_SECRET' \
  --from-literal=db-password='NEW_DB_PASSWORD' \
  --from-literal=db-user='postgres'

# Перезапустить поды для применения новых секретов
kubectl rollout restart deployment/feed-service
kubectl rollout restart deployment/admin-service
kubectl rollout restart deployment/auth-service
kubectl rollout restart deployment/postgres
```

## Для CI/CD (GitHub Actions)

Добавьте секреты в GitHub Settings → Secrets:

- `DOCKERHUB_USERNAME` - ваш Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `KUBE_CONFIG` - base64-encoded kubeconfig для доступа к кластеру

```bash
# Закодировать kubeconfig в base64
cat ~/.kube/config | base64
```

