Set-Location "C:\Users\vinay\Documents\GitHub\karmada\dashboard"
$kc = "C:\Users\vinay\.kube\config"
$kc_karmada = "C:\Users\vinay\.kube\karmada.config"
$args = @("run", "cmd/api/main.go", "--kubeconfig=$kc", "--context=minikube", "--skip-kube-apiserver-tls-verify", "--karmada-kubeconfig=$kc_karmada", "--karmada-context=karmada-apiserver", "--skip-karmada-apiserver-tls-verify", "--insecure-port=8000")
& go @args 2>&1 | Tee-Object -FilePath "C:\Users\vinay\Documents\GitHub\karmada\dashboard\api.log"
