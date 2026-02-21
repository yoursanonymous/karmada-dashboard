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

package deployment

import (
	"context"
	"fmt"

	karmadaclientset "github.com/karmada-io/karmada/pkg/generated/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// PropagationPolicyRef holds a reference to a PropagationPolicy.
type PropagationPolicyRef struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// ResourceBindingRef holds a reference to a ResourceBinding.
type ResourceBindingRef struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// WorkRef holds a reference to a Work resource in a member cluster.
type WorkRef struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	ClusterName string `json:"clusterName"`
}

// ResourceRelationship maps the propagation chain for a Deployment.
type ResourceRelationship struct {
	PropagationPolicy *PropagationPolicyRef `json:"propagationPolicy"`
	ResourceBinding   *ResourceBindingRef   `json:"resourceBinding"`
	Works             []WorkRef             `json:"works"`
}

// GetDeploymentRelationships fetches the PropagationPolicy, ResourceBinding and Work
// resources that are associated with the given Deployment.
func GetDeploymentRelationships(karmadaClient karmadaclientset.Interface, deploymentName, namespace string) (*ResourceRelationship, error) {
	result := &ResourceRelationship{
		Works: []WorkRef{},
	}

	if karmadaClient == nil {
		return result, nil
	}

	// 1. Find PropagationPolicy by matching resourceSelectors
	result.PropagationPolicy = findPropagationPolicy(karmadaClient, deploymentName, namespace)

	// 2. Find ResourceBinding
	result.ResourceBinding = findResourceBinding(karmadaClient, deploymentName, namespace)

	// 3. Find Work resources referencing this deployment's ResourceBinding
	if result.ResourceBinding != nil {
		result.Works = findWorks(karmadaClient, result.ResourceBinding.Name)
	}

	return result, nil
}

func findPropagationPolicy(karmadaClient karmadaclientset.Interface, deploymentName, namespace string) *PropagationPolicyRef {
	pps, err := karmadaClient.PolicyV1alpha1().PropagationPolicies(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil
	}
	for _, pp := range pps.Items {
		for _, rs := range pp.Spec.ResourceSelectors {
			if rs.Kind == "Deployment" && (rs.Name == "" || rs.Name == deploymentName) {
				ns := pp.Namespace
				if ns == "" {
					ns = namespace
				}
				return &PropagationPolicyRef{
					Name:      pp.Name,
					Namespace: ns,
				}
			}
		}
	}
	return nil
}

func findResourceBinding(karmadaClient karmadaclientset.Interface, deploymentName, namespace string) *ResourceBindingRef {
	// Try finding by naming convention: <deploymentName>-deployment
	bindingName := fmt.Sprintf("%s-deployment", deploymentName)
	rb, err := karmadaClient.WorkV1alpha2().ResourceBindings(namespace).Get(context.TODO(), bindingName, metav1.GetOptions{})
	if err == nil {
		return &ResourceBindingRef{
			Name:      rb.Name,
			Namespace: rb.Namespace,
		}
	}

	// Fallback: list all ResourceBindings and match by Spec.Resource
	rbs, listErr := karmadaClient.WorkV1alpha2().ResourceBindings(namespace).List(context.TODO(), metav1.ListOptions{})
	if listErr == nil {
		for _, item := range rbs.Items {
			ref := item.Spec.Resource
			if ref.Kind == "Deployment" && ref.Name == deploymentName {
				return &ResourceBindingRef{
					Name:      item.Name,
					Namespace: item.Namespace,
				}
			}
		}
	}
	return nil
}

func findWorks(karmadaClient karmadaclientset.Interface, bindingName string) []WorkRef {
	works := []WorkRef{}
	workList, werr := karmadaClient.WorkV1alpha1().Works("").List(context.TODO(), metav1.ListOptions{})
	if werr == nil {
		for _, w := range workList.Items {
			if owner, ok := w.Labels["resourcebinding.karmada.io/name"]; ok {
				if owner == bindingName {
					works = append(works, WorkRef{
						Name:        w.Name,
						Namespace:   w.Namespace,
						ClusterName: w.Namespace, // namespace is the cluster name for Work
					})
				}
			}
		}
	}
	return works
}
