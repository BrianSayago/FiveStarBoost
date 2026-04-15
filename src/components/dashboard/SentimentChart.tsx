import { useState } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  positive: number;
  negative: number;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0px 8px 12px ${fill}60)` }}
        className="transition-all duration-300 ease-out"
      />
    </g>
  );
};

export function SentimentChart({ positive, negative }: SentimentChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();

  const data = [
    { name: 'Huéspedes Satisfechos (3 a 5 ★)', value: positive, color: '#10b981' }, 
    { name: 'Requieren Atención (1 a 2 ★)', value: negative, color: '#ef4444' }
  ];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  if (positive === 0 && negative === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800">
        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm text-gray-500 font-medium">Recopilando datos de huéspedes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Distribución de Reseñas</h3>
        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md">General</span>
      </div>
      <div className="flex-1 w-full min-h-[220px] pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...({ activeIndex } as any)}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={95}
              paddingAngle={6}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  className="transition-all duration-300 outline-none cursor-pointer" 
                  style={{ 
                     outline: 'none', 
                     filter: activeIndex === index || activeIndex === undefined ? 'brightness(1)' : 'brightness(0.85) grayscale(0.15)',
                     transition: 'filter 0.3s ease'
                  }} 
                />
              ))}
            </Pie>
              <Tooltip 
                cursor={false}
                contentStyle={{ borderRadius: '16px', border: '1px solid #334155', backgroundColor: '#1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 700, color: '#f8fafc', paddingBottom: '4px' }}
                formatter={(value, name) => [`${value} Estadías`, name]}
              />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
