import React from 'react';

// Shared X/O symbol geometry — rendered inside 3D cells when show3DSymbols is on

interface SymbolProps {
  color: string;
  size?: number; // scale factor, default 1
}

export function XSymbol3D({ color, size = 1 }: SymbolProps) {
  const len = 0.55 * size;
  const thick = 0.12 * size;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[len, thick, thick]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[len, thick, thick]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export function OSymbol3D({ color, size = 1 }: SymbolProps) {
  return (
    <mesh>
      {/* torusGeometry lies in XY plane by default — faces +Z camera */}
      <torusGeometry args={[0.2 * size, 0.065 * size, 8, 20]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
