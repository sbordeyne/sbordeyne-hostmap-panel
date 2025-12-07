# Hostmap Panel

![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fsbordeyne-hostmap-panel&query=%24.downloads&logo=grafana&label=Downloads)
![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fsbordeyne-hostmap-panel&query=%24.version&logo=grafana&label=Version)
![Grafana Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fsbordeyne-hostmap-panel&query=%24.grafanaDependency&logo=grafana&label=Grafana)
![Signature](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fsbordeyne-hostmap-panel&query=%24.versionSignatureType&logo=grafana&label=Signature)

## Overview / Introduction

Hostmap panel that displays hosts in a hex/honeycomb pattern. It supports displaying any number of hosts, and color coding them based on the value of the metric returned.

It also supports grouping hosts by labels to get a quick glance at how many nodes are in a nodepool, or how many nodes in a single zone.

## Requirements

This plugin requires Grafana 12.1 or later, due to it being translated. If you need it to run in an earlier version of grafana, please feel free to fork and mock the `t` function with

```ts
export function t(translationKey: string, defaultValue: string): string {
  return defaultValue;
}
```

## Getting Started

This plugin is primarily designed around the use of a Prometheus datasource (Mimir, VictoriaMetrics, Thanos, Prometheus) that scraped the prometheus `node-exporter`.

You can use `kyverno` to enrich the node-exporter pods with node metrics with the following `ClusterPolicy`

```yaml
apiVersion: kyverno.io/v2beta1
kind: ClusterPolicy
metadata:
  name: add-node-labels-pod
  annotations:
    pod-policies.kyverno.io/autogen-controllers: none
    policies.kyverno.io/title: Add scheduled Node's labels to a Pod
    policies.kyverno.io/category: Other
    policies.kyverno.io/subject: Pod
    kyverno.io/kyverno-version: 1.10.0
    policies.kyverno.io/minversion: 1.10.0
    kyverno.io/kubernetes-version: "1.26"
    policies.kyverno.io/description: >-
      Containers running in Pods may sometimes need access to node-specific information on
      which the Pod has been scheduled. A common use case is node topology labels to ensure
      pods are spread across failure zones in racks or in the cloud. The mutate-pod-binding
      policy already does this for annotations, but it does not handle labels. A useful use
      case is for passing metric label information to ServiceMonitors and then into Prometheus.
      This policy watches for Pod binding events when the pod is scheduled and then
      asynchronously mutates the existing Pod to add the labels.
      This policy requires the following changes to common default configurations:
      - The kyverno resourceFilter should not filter Pod/binding resources.
      - The kyverno backgroundController service account requires Update permission on pods.
      It is recommended to use https://kubernetes.io/docs/reference/access-authn-authz/rbac/#aggregated-clusterroles
spec:
  rules:
    - name: add-node-labels-to-pod-binding-annotations
      match:
        any:
        - resources:
            kinds:
            - Pod/binding
      context:
      - name: node
        variable:
          jmesPath: request.object.target.name
          default: ''
      - name: zone
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."topology.kubernetes.io/zone" || "empty"'
      - name: region
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."topology.kubernetes.io/region" || "empty"'
      - name: arch
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."kubernetes.io/arch" || "empty"'
      - name: os
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."kubernetes.io/os" || "empty"'
      - name: nodepool
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."cloud.google.com/gke-nodepool" || "empty"'
      - name: machineFamily
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."cloud.google.com/machine-family" || "empty"'
      - name: instanceType
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."node.kubernetes.io/instance-type" || "empty"'
      mutate:
        patchStrategicMerge:
          metadata:
            annotations:
              topology.kubernetes.io/region: "{{ region }}"
              topology.kubernetes.io/zone: "{{ zone }}"
              kubernetes.io/arch: "{{ arch }}"
              kubernetes.io/os: "{{ os }}"
              cloud.google.com/gke-nodepool: "{{ nodepool }}"
              cloud.google.com/machine-family: "{{ machineFamily }}"
              node.kubernetes.io/instance-type: "{{ instanceType }}"

    - name: add-node-labels-pod
      match:
        any:
        - resources:
            kinds:
            - Pod/binding
      context:
      - name: node
        variable:
          jmesPath: request.object.target.name
          default: ''
      - name: zone
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."topology.kubernetes.io/zone" || "empty"'
      - name: region
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."topology.kubernetes.io/region" || "empty"'
      - name: arch
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."kubernetes.io/arch" || "empty"'
      - name: os
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."kubernetes.io/os" || "empty"'
      - name: nodepool
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."cloud.google.com/gke-nodepool" || "empty"'
      - name: machineFamily
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."cloud.google.com/machine-family" || "empty"'
      - name: instanceType
        apiCall:
          urlPath: "/api/v1/nodes/{{node}}"
          jmesPath: 'metadata.labels."node.kubernetes.io/instance-type" || "empty"'
      mutate:
        targets:
        - apiVersion: v1
          kind: Pod
          name: "{{ request.object.metadata.name }}"
          namespace: "{{ request.object.metadata.namespace }}"
        patchStrategicMerge:
          metadata:
            labels:
              topology.kubernetes.io/region: "{{ region }}"
              topology.kubernetes.io/zone: "{{ zone }}"
              kubernetes.io/arch: "{{ arch }}"
              kubernetes.io/os: "{{ os }}"
              cloud.google.com/gke-nodepool: "{{ nodepool }}"
              cloud.google.com/machine-family: "{{ machineFamily }}"
              node.kubernetes.io/instance-type: "{{ instanceType }}"
```

Then you can scrape node-exporter with the following relabeling rules:

```yaml
apiVersion: operator.victoriametrics.com/v1beta1
kind: VMServiceScrape
metadata:
  name: prometheus-node-exporter
  labels:
    app.kubernetes.io/name: prometheus-node-exporter
    app.kubernetes.io/managed-by: kustomize
spec:
  endpoints:
    - metricRelabelConfigs:
        - action: drop
          regex: /var/lib/kubelet/pods.+
          source_labels:
            - mountpoint
      relabelConfigs:
        - source_labels:
            [__meta_kubernetes_pod_annotation_topology_kubernetes_io_zone]
          target_label: zone
        - source_labels:
            [__meta_kubernetes_pod_annotation_topology_kubernetes_io_region]
          target_label: region
        - source_labels: [__meta_kubernetes_endpoint_node_name]
          target_label: nodename
        - source_labels: [__meta_kubernetes_endpoint_node_name]
          target_label: cluster
          regex: ^gke-([^\r\n\t\f\v\-]+\-?[^\r\n\t\f\v\-]+)-(\S+)-(\S+?)-(\S+?)$
          replacement: $1
        - source_labels: [__meta_kubernetes_pod_annotation_cloud_google_com_gke_nodepool]
          target_label: nodepool
        - source_labels: [__meta_kubernetes_pod_annotation_cloud_google_com_machine_family]
          target_label: machine_family
        - source_labels: [__meta_kubernetes_pod_annotation_node_kubernetes_io_instance_type]
          target_label: instance_type
        - source_labels: [__meta_kubernetes_pod_annotation_kubernetes_io_arch]
          target_label: arch
        - source_labels: [__meta_kubernetes_pod_annotation_kubernetes_io_os]
          target_label: os
      port: metrics
  jobLabel: jobLabel
  selector:
    matchLabels:
      app.kubernetes.io/name: prometheus-node-exporter
```

These examples are given for GKE / victoriametrics but should translate easily to other stacks (EKS/AKS, Mimir/Prometheus)

Here are example queries that should work with this panel:

```promql
100 - (avg by (env, arch, machine_family, nodename,nodepool,os,region,zone) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)
```

## Contributing

Feel free to contribute by either raising issues, add documentation or add features to the panel.

Use of agentic AI is allowed for this project as long as it follows the guidelines in `AGENTS.md`.

The panel should be kept working for Prometheus-compatible datasources. Other datasources may be supported as long as Prometheus works. This is the only datasource type officially supported for now.
