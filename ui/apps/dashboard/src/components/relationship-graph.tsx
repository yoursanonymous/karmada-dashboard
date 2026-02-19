/*
Copyright 2026 The Karmada Authors.

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

import { FC } from 'react';
import { Card, Tag, Typography, Space, Empty, Descriptions } from 'antd';
import {
  DeploymentUnitOutlined,
  ApartmentOutlined,
  LinkOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

export interface PropagationPolicyRef {
  name: string;
  namespace: string;
}

export interface ResourceBindingRef {
  name: string;
  namespace: string;
}

export interface WorkRef {
  name: string;
  namespace: string;
  clusterName: string;
}

export interface ResourceRelationship {
  propagationPolicy?: PropagationPolicyRef;
  resourceBinding?: ResourceBindingRef;
  works?: WorkRef[];
}

interface RelationshipGraphProps {
  deploymentName: string;
  namespace: string;
  relationships?: ResourceRelationship;
}

const NodeCard: FC<{
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ icon, title, color, children }) => (
  <div
    style={{
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: '12px 16px',
      background: '#fff',
      minWidth: 200,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        color,
        fontWeight: 600,
      }}
    >
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const Arrow: FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      color: '#8c8c8c',
      fontSize: 20,
      userSelect: 'none',
    }}
  >
    →
  </div>
);

const RelationshipGraph: FC<RelationshipGraphProps> = ({
  deploymentName,
  namespace,
  relationships,
}) => {
  if (!relationships) {
    return (
      <Empty
        description="No relationship data available. Ensure Karmada is installed and a PropagationPolicy exists for this Deployment."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const { propagationPolicy, resourceBinding, works } = relationships;

  return (
    <div>
      {/* Flow diagram */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          overflowX: 'auto',
          padding: '16px 8px',
          gap: 4,
        }}
      >
        {/* Deployment node */}
        <NodeCard
          icon={<DeploymentUnitOutlined />}
          title="Deployment"
          color="#1677ff"
        >
          <Descriptions size="small" column={1}>
            <Descriptions.Item label="Name">
              <Typography.Text strong>{deploymentName}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Namespace">
              <Tag color="blue">{namespace}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </NodeCard>

        <Arrow />

        {/* PropagationPolicy node */}
        <NodeCard
          icon={<ApartmentOutlined />}
          title="PropagationPolicy"
          color={propagationPolicy ? '#52c41a' : '#d9d9d9'}
        >
          {propagationPolicy ? (
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Name">
                <Typography.Text strong>{propagationPolicy.name}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Namespace">
                <Tag color="green">{propagationPolicy.namespace}</Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">None found</Typography.Text>
          )}
        </NodeCard>

        <Arrow />

        {/* ResourceBinding node */}
        <NodeCard
          icon={<LinkOutlined />}
          title="ResourceBinding"
          color={resourceBinding ? '#722ed1' : '#d9d9d9'}
        >
          {resourceBinding ? (
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Name">
                <Typography.Text strong>{resourceBinding.name}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Namespace">
                <Tag color="purple">{resourceBinding.namespace}</Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">None found</Typography.Text>
          )}
        </NodeCard>

        <Arrow />

        {/* Works / Member Clusters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {works && works.length > 0 ? (
            works.map((w) => (
              <NodeCard
                key={`${w.clusterName}-${w.name}`}
                icon={<CloudServerOutlined />}
                title="Work (Member Cluster)"
                color="#fa8c16"
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Cluster">
                    <Tag color="orange">{w.clusterName}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Work Name">
                    <Typography.Text copyable style={{ fontSize: 11 }}>
                      {w.name}
                    </Typography.Text>
                  </Descriptions.Item>
                </Descriptions>
              </NodeCard>
            ))
          ) : (
            <NodeCard
              icon={<CloudServerOutlined />}
              title="Work (Member Clusters)"
              color="#d9d9d9"
            >
              <Typography.Text type="secondary">None found</Typography.Text>
            </NodeCard>
          )}
        </div>
      </div>

      {/* Summary table */}
      <Card
        size="small"
        title="Propagation Chain Summary"
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Deployment">
              {deploymentName}
            </Descriptions.Item>
            <Descriptions.Item label="Namespace">{namespace}</Descriptions.Item>
            <Descriptions.Item label="PropagationPolicy">
              {propagationPolicy ? (
                <Tag color="green">{propagationPolicy.name}</Tag>
              ) : (
                <Tag color="default">None</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="ResourceBinding">
              {resourceBinding ? (
                <Tag color="purple">{resourceBinding.name}</Tag>
              ) : (
                <Tag color="default">None</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Distributed To" span={2}>
              {works && works.length > 0 ? (
                <Space wrap>
                  {works.map((w) => (
                    <Tag key={w.clusterName} color="orange" icon={<CloudServerOutlined />}>
                      {w.clusterName}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Tag color="default">No member clusters</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>
    </div>
  );
};

export default RelationshipGraph;
