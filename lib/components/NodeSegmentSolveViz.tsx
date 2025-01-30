import React from 'react';

export interface NodeSolveInput {
  center: { x: number, y: number }
  width: number
  height: number
  segmentsToConnect: Array<{
    segment1: { start: { x: number, y: number }, end: { x: number, y: number } }
    segment2: { start: { x: number, y: number }, end: { x: number, y: number } }
    traceId: string
  }>,
}

export interface NodeSolveOutput extends NodeSolveInput {
  ports: Array<{ x: number, y: number, traceId: string }>
}

export interface Props {
  input: NodeSolveInput,
  output?: NodeSolveOutput
}

export const NodeSolveViz = ({ input, output }: Props) => {
  const scale = 40; // Scale factor to make the visualization larger
  const padding = 50; // Padding around the visualization
  
  // Calculate SVG dimensions based on input width/height
  const svgWidth = (input.width * scale) + (padding * 2);
  const svgHeight = (input.height * scale) + (padding * 2);
  
  // Transform coordinate system to center
  const transformOrigin = `translate(${svgWidth/2}, ${svgHeight/2})`;
  
  // Generate random colors for each unique traceId
  const traceColors: Record<string, string> = {};
  input.segmentsToConnect.forEach(({ traceId }) => {
    if (!traceColors[traceId]) {
      const hue = Object.keys(traceColors).length * (360 / input.segmentsToConnect.length);
      traceColors[traceId] = `hsl(${hue}, 70%, 60%)`;
    }
  });

  // Helper to convert from problem space to SVG space
  const toSvgPoint = (point) => ({
    x: point.x * scale,
    y: point.y * scale
  });

  return (
    <div>
    <div className="flex-1 flex items-center space-y-4">
      {/* Input Visualization */}
      <div className="border rounded p-4 flex-1">
        <h2 className="text-lg font-semibold mb-4">Input</h2>
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          className="bg-gray-50"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <g transform={transformOrigin}>
            {/* Draw the square border */}
            <rect
              x={-(input.width * scale)/2}
              y={-(input.height * scale)/2}
              width={input.width * scale}
              height={input.height * scale}
              fill="none"
              stroke="black"
              opacity={0.5}
              strokeWidth="1"
            />
            
            {/* Draw center point */}
            <circle
              cx={0}
              cy={0}
              r={4}
              fill="black"
            />
            
            {/* Draw segments */}
            {input.segmentsToConnect.map((connection, idx) => {
              const s1Start = toSvgPoint(connection.segment1.start);
              const s1End = toSvgPoint(connection.segment1.end);
              const s2Start = toSvgPoint(connection.segment2.start);
              const s2End = toSvgPoint(connection.segment2.end);
              
              return (
                <g key={`input-${idx}`}>
                  <line
                    x1={s1Start.x}
                    y1={s1Start.y}
                    x2={s1End.x}
                    y2={s1End.y}
                    stroke={traceColors[connection.traceId]}
                    strokeWidth="6"
                    strokeDashoffset={idx * 2.5}
                    strokeDasharray={`2 6`}
                  />
                  <line
                    x1={s2Start.x}
                    y1={s2Start.y}
                    x2={s2End.x}
                    y2={s2End.y}
                    stroke={traceColors[connection.traceId]}
                    strokeDashoffset={idx}
                    strokeDasharray={`2 6`}
                    strokeWidth="6"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Output Visualization */}
      {output && (
        <div className="border rounded p-4 flex-1">
          <h2 className="text-lg font-semibold mb-4">Output</h2>
          <svg 
            width={svgWidth} 
            height={svgHeight}
            className="bg-gray-50"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          >
            <g transform={transformOrigin}>
              {/* Draw the square border */}
              <rect
                x={-(output.width * scale)/2}
                y={-(output.height * scale)/2}
                width={output.width * scale}
                height={output.height * scale}
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
              
              {/* Draw segments (faded) */}
              {output.segmentsToConnect.map((connection, idx) => {
                const s1Start = toSvgPoint(connection.segment1.start);
                const s1End = toSvgPoint(connection.segment1.end);
                const s2Start = toSvgPoint(connection.segment2.start);
                const s2End = toSvgPoint(connection.segment2.end);
                
                return (
                  <g key={`output-segments-${idx}`} opacity="0.3">
                    <line
                      x1={s1Start.x}
                      y1={s1Start.y}
                      x2={s1End.x}
                      y2={s1End.y}
                      stroke={traceColors[connection.traceId]}
                      strokeWidth="3"
                    />
                    <line
                      x1={s2Start.x}
                      y1={s2Start.y}
                      x2={s2End.x}
                      y2={s2End.y}
                      stroke={traceColors[connection.traceId]}
                      strokeWidth="3"
                    />
                  </g>
                );
              })}
              
              {/* Draw ports and connections */}
              {output.ports && output.ports.reduce((pairs, port, idx, ports) => {
                if (idx % 2 === 0 && idx + 1 < ports.length && 
                    ports[idx].traceId === ports[idx + 1].traceId) {
                  const start = toSvgPoint(port);
                  const end = toSvgPoint(ports[idx + 1]);
                  pairs.push(
                    <g key={`connection-${idx}`}>
                      <path
                        d={`M ${start.x} ${start.y} C ${(start.x + end.x)/2} ${start.y}, ${(start.x + end.x)/2} ${end.y}, ${end.x} ${end.y}`}
                        fill="none"
                        stroke={traceColors[port.traceId]}
                        strokeWidth="2"
                      />
                      <circle
                        cx={start.x}
                        cy={start.y}
                        r={6}
                        fill={traceColors[port.traceId]}
                      />
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r={6}
                        fill={traceColors[port.traceId]}
                      />
                    </g>
                  );
                }
                return pairs;
              }, [])}
            </g>
          </svg>
        </div>
      )}
    </div>
      <div className="border rounded p-4 flex gap-4 flex-wrap">
        {input.segmentsToConnect.map(({ traceId }) => (
          <div key={traceId} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: traceColors[traceId] }}
            />
            <span>{traceId}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeSolveViz;