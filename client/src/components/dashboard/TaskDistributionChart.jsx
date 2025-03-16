import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

// 简单实现的图表组件，生产环境可以使用Chart.js或其他库
export const TaskDistributionChart = ({ tasks = [] }) => {
  const canvasRef = useRef(null);
  
  // 计算任务状态分布
  const calculateDistribution = () => {
    const statusCounts = {
      'not_started': 0,
      'in_progress': 0,
      'completed': 0,
      'blocked': 0,
      'cancelled': 0
    };
    
    // 如果没有任务，返回默认分布
    if (!tasks || tasks.length === 0) {
      return {
        'not_started': 2,
        'in_progress': 3,
        'completed': 4,
        'blocked': 1,
        'cancelled': 0
      };
    }
    
    // 统计不同状态的任务数量
    tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });
    
    return statusCounts;
  };
  
  // 绘制简单的条形图
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const distribution = calculateDistribution();
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置图表尺寸
    const chartWidth = canvas.width - 60; // 留出左侧空间给标签
    const chartHeight = canvas.height - 40; // 留出底部空间给标签
    const barWidth = chartWidth / Object.keys(distribution).length / 1.5;
    const maxValue = Math.max(...Object.values(distribution));
    
    // 颜色映射
    const colors = {
      'not_started': '#6366F1', // indigo
      'in_progress': '#F59E0B', // amber
      'completed': '#10B981', // emerald
      'blocked': '#EF4444', // red
      'cancelled': '#9CA3AF', // gray
    };
    
    // 绘制条形
    let x = 50; // 起始x坐标
    Object.entries(distribution).forEach(([status, count]) => {
      const barHeight = (count / (maxValue || 1)) * chartHeight;
      
      // 绘制条形
      ctx.fillStyle = colors[status] || '#6B7280';
      ctx.fillRect(x, canvas.height - 30 - barHeight, barWidth, barHeight);
      
      // 绘制数值
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(count.toString(), x + barWidth / 2, canvas.height - 35 - barHeight);
      
      // 绘制状态标签
      ctx.fillText(getStatusLabel(status), x + barWidth / 2, canvas.height - 10);
      
      x += chartWidth / Object.keys(distribution).length;
    });
  };
  
  // 获取状态的中文标签
  const getStatusLabel = (status) => {
    const labels = {
      'not_started': '未开始',
      'in_progress': '进行中',
      'completed': '已完成',
      'blocked': '已阻塞',
      'cancelled': '已取消'
    };
    return labels[status] || status;
  };
  
  useEffect(() => {
    drawChart();
    
    // 窗口大小变化时重绘图表
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [tasks]);
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">任务状态分布</h3>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          width="400"
          height="200"
          className="w-full"
        ></canvas>
      </CardContent>
    </Card>
  );
}; 