"use client";

import { PropsWithChildren } from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

type ProvidersProps = PropsWithChildren<{ cookies: string | null }>; 

export default function Providers({ cookies, children }: ProvidersProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      {children}
    </ChakraProvider>
  );
}


