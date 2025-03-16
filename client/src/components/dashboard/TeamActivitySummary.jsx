import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const TeamActivitySummary = ({ members = [] }) => {
  // 如果没有成员数据，使用演示数据
  const teamMembers = members.length > 0 ? members : [
    { id: 1, name: '张三', role: 'owner', contributions: 24, avatar: '' },
    { id: 2, name: '李四', role: 'admin', contributions: 18, avatar: '' },
    { id: 3, name: '王五', role: 'member', contributions: 12, avatar: '' },
    { id: 4, name: '赵六', role: 'member', contributions: 8, avatar: '' },
    { id: 5, name: '钱七', role: 'viewer', contributions: 3, avatar: '' }
  ];

  // 计算总贡献量
  const totalContributions = teamMembers.reduce((sum, member) => sum + member.contributions, 0);

  // 根据角色获取徽章样式
  const getRoleBadgeVariant = (role) => {
    const variants = {
      'owner': 'primary',
      'admin': 'success',
      'member': 'warning',
      'viewer': 'default'
    };
    return variants[role] || 'default';
  };

  // 获取角色的中文名称
  const getRoleName = (role) => {
    const names = {
      'owner': '所有者',
      'admin': '管理员',
      'member': '成员',
      'viewer': '观察者'
    };
    return names[role] || role;
  };

  // 计算贡献百分比并生成进度条宽度样式
  const getContributionStyle = (contributions) => {
    const percentage = totalContributions > 0 
      ? (contributions / totalContributions) * 100 
      : 0;
    return {
      width: `${percentage}%`
    };
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">团队贡献统计</h3>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {teamMembers.map((member) => (
              <li key={member.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {member.avatar ? (
                      <img className="h-8 w-8 rounded-full" src={member.avatar} alt={member.name} />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleName(member.role)}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        {member.contributions} 贡献
                      </p>
                    </div>
                  </div>
                  <div className="flex-grow mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={getContributionStyle(member.contributions)}
                      ></div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-medium text-gray-500">
                    {totalContributions > 0 
                      ? `${Math.round((member.contributions / totalContributions) * 100)}%` 
                      : '0%'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">
          总贡献: <span className="font-medium">{totalContributions}</span>
        </p>
      </CardFooter>
    </Card>
  );
}; 