import React, { PropsWithChildren } from 'react';
import { Container, Grid, GridCol, Paper, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const Header = () => (
    <Paper p="md" shadow="xs">
        <Text >Logo</Text>
    </Paper>
);

const Sidebar = ({ isOpen }: {isOpen: boolean}) => (
    <Paper p="md" shadow="xs" style={{ display: isOpen ? 'block' : 'none' }}>
        <Text>Section 1</Text>
        <Text>Section 2</Text>
    </Paper>
);

const Main = ({ children } : PropsWithChildren) => (
    <Paper p="md" shadow="xs">
        {children}
    </Paper>
);

const Layout = ({ children }: PropsWithChildren) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isOpen, setIsOpen] = React.useState(!isMobile);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <Container>
            <Header />
            <Grid >
                <GridCol span={12}  >
                    <Sidebar isOpen={isOpen} />
                </GridCol>
                <GridCol span={12} >
                    <button onClick={toggleSidebar} style={{ marginBottom: '1em' }} />
                    <Main>{children}</Main>
                </GridCol>
            </Grid>
        </Container>
    );
};

export default Layout;