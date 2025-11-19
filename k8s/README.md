# Kubernetes Deployment Guide

Инструкция по деплою RSS Platform в Kubernetes кластер.

## Предварительные требования

- Kubernetes кластер (Minikube, K3s, или облачный)
- kubectl настроен и подключен к кластеру
- Docker образы собраны и запушены в Docker Hub

## Быстрый деплой

### 1. Настройте Secrets (ВАЖНО!)

⚠️ **Для production обязательно измените дефолтные пароли!**

```bash
# Для разработки (дефолтные значения)
kubectl apply -f secrets.yaml

# Для production (генерируйте сильные пароли!)
kubectl create secret generic rss-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=db-password=$(openssl rand -base64 24) \
  --from-literal=db-user=postgres
```

📖 Подробнее см. [SECRETS_SETUP.md](./SECRETS_SETUP.md)

### 2. Обновите образы в манифестах

Замените `your-dockerhub-username` на ваш Docker Hub username во всех файлах:

```bash
sed -i 's/your-dockerhub-username/YOUR_USERNAME/g' k8s/*.yaml
```

### 3. Примените конфигурации

```bash
# Применить ConfigMap для инициализации БД
kubectl apply -f configmap-postgres-init.yaml

# Применить Secrets (если еще не применили)
kubectl apply -f secrets.yaml

# Применить PostgreSQL
kubectl apply -f postgres-deployment.yaml

# Дождитесь готовности PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Применить сервисы
kubectl apply -f feed-service-deployment.yaml
kubectl apply -f admin-service-deployment.yaml
kubectl apply -f auth-service-deployment.yaml
kubectl apply -f api-gateway-deployment.yaml

# Применить Ingress (опционально)
kubectl apply -f ingress.yaml
```

### 3. Проверьте статус

```bash
# Проверить поды
kubectl get pods

# Проверить сервисы
kubectl get services

# Просмотр логов
kubectl logs -f deployment/feed-service
kubectl logs -f deployment/api-gateway
```

## Деплой в Minikube

### 1. Запустите Minikube

```bash
minikube start
```

### 2. Включите Ingress

```bash
minikube addons enable ingress
```

### 3. Примените манифесты (см. выше)

### 4. Получите URL API Gateway

```bash
# Для LoadBalancer
minikube service api-gateway --url

# Или для Ingress
minikube ip
# Добавьте в /etc/hosts: <minikube-ip> rss-platform.local
```

## Масштабирование

### Увеличить количество реплик

```bash
kubectl scale deployment feed-service --replicas=3
kubectl scale deployment admin-service --replicas=3
kubectl scale deployment auth-service --replicas=3
kubectl scale deployment api-gateway --replicas=3
```

Или отредактируйте файлы `*-deployment.yaml` и установите нужное количество `replicas`.

## Обновление образа

```bash
# Обновить образ для конкретного сервиса
kubectl set image deployment/feed-service feed-service=YOUR_USERNAME/rss-feed-service:NEW_TAG

# Проверить статус обновления
kubectl rollout status deployment/feed-service
```

## Мониторинг

### Просмотр метрик

```bash
# CPU и память
kubectl top pods

# Детальная информация о поде
kubectl describe pod <pod-name>
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверить логи PostgreSQL
kubectl logs deployment/postgres

# Проверить подключение к БД из пода
kubectl exec -it deployment/postgres -- psql -U postgres -d rss_platform
```

### Проблемы с сервисами

```bash
# Проверить endpoints
kubectl get endpoints

# Проверить логи конкретного сервиса
kubectl logs -f deployment/feed-service

# Перезапустить deployment
kubectl rollout restart deployment/feed-service
```

## Очистка

```bash
# Удалить все ресурсы
kubectl delete -f ingress.yaml
kubectl delete -f api-gateway-deployment.yaml
kubectl delete -f auth-service-deployment.yaml
kubectl delete -f admin-service-deployment.yaml
kubectl delete -f feed-service-deployment.yaml
kubectl delete -f postgres-deployment.yaml
kubectl delete -f secrets.yaml
kubectl delete -f configmap-postgres-init.yaml

# Удалить PVC (удалит данные!)
kubectl delete pvc postgres-pvc
```

