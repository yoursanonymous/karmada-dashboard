/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package client

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"k8s.io/klog/v2"
)

// HealthCheckHandler handles the /readyz endpoint by verifying connectivity to K8s and Karmada API servers.
func HealthCheckHandler(c *gin.Context) {
	// 1. Check Kubernetes Connectivity
	if _, err := InClusterClient().Discovery().ServerVersion(); err != nil {
		klog.Errorf("Kubernetes health check failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "failed",
			"reason": "unable to reach Kubernetes API server",
			"error":  err.Error(),
		})
		return
	}

	// 2. Check Karmada Connectivity
	if _, err := InClusterKarmadaClient().Discovery().ServerVersion(); err != nil {
		klog.Errorf("Karmada health check failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "failed",
			"reason": "unable to reach Karmada API server",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
