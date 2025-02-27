import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Text,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Button,
  IconButton
} from '@chakra-ui/react';
import { TimeIcon, RepeatIcon } from '@chakra-ui/icons';
import { getDashboardStats } from '../services/dashboardService';
import { endSession } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    user_stats: {},
    machine_stats: {
      total_machines: 0,
      available_machines: 0,
      in_use_machines: 0,
      maintenance_machines: 0
    },
    session_stats: { active_sessions: 0 },
    revenue_stats: { daily_revenue: 0 },
    recent_sessions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const timerRef = useRef(null);

  // Fetch stats on component mount
  useEffect(() => {
    fetchDashboardStats();
    
    // Set up timer to refresh stats every minute
    timerRef.current = setInterval(() => {
      fetchDashboardStats(false); // Don't show loading spinner for refreshes
    }, 60000);
    
    // Clean up timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await getDashboardStats();
      setStats(response);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard stats. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Handle refreshing dashboard
  const handleRefresh = () => {
    fetchDashboardStats(true);
    toast({
      title: 'Dashboard refreshed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle ending a session
  const handleEndSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        await endSession(sessionId);
        
        // Refresh the dashboard stats
        fetchDashboardStats();
        
        toast({
          title: 'Session ended',
          description: 'The session has been ended successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Calculate time remaining for active sessions
  const calculateTimeRemaining = (session) => {
    if (!session || !session.start_time || !session.hourly_rate || session.hourly_rate <= 0) {
      return "0h 0m";
    }
    
    // Get user balance (either from the session or from the current user)
    const userBalance = session.user_balance || 
                         (session.user_id === user?.id ? user.balance : 0);
    
    // Calculate elapsed time in hours
    const start = new Date(session.start_time);
    const now = new Date();
    const elapsedHours = (now - start) / (1000 * 60 * 60);
    
    // Calculate cost so far
    const costSoFar = elapsedHours * session.hourly_rate;
    
    // Calculate remaining balance
    const remainingBalance = Math.max(0, userBalance - costSoFar);
    
    // Calculate remaining time
    const remainingHours = remainingBalance / session.hourly_rate;
    
    // Convert to hours and minutes
    const hours = Math.floor(remainingHours);
    const minutes = Math.floor((remainingHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header section */}
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">Dashboard</Heading>
        
        <IconButton
          icon={<RepeatIcon />}
          colorScheme="blue"
          onClick={handleRefresh}
          aria-label="Refresh dashboard"
        />
      </Flex>
      
      {/* Error message */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}
      
      {/* Loading state */}
      {loading ? (
        <Flex justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      ) : (
        <>
          {/* Admin Dashboard */}
          {isAdmin() && (
            <>
              {/* Stats cards */}
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                <Card>
                  <CardHeader pb={0}>
                    <Stat>
                      <StatLabel>Total Users</StatLabel>
                      <StatNumber>{stats.user_stats.total_users}</StatNumber>
                    </Stat>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500">Registered users in the system</Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader pb={0}>
                    <Stat>
                      <StatLabel>Active Sessions</StatLabel>
                      <StatNumber>{stats.session_stats.active_sessions}</StatNumber>
                    </Stat>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500">Currently ongoing sessions</Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader pb={0}>
                    <Stat>
                      <StatLabel>Machine Usage</StatLabel>
                      <StatNumber>
                        {stats.machine_stats.in_use_machines} / {stats.machine_stats.total_machines}
                      </StatNumber>
                    </Stat>
                  </CardHeader>
                  <CardBody>
                    <Progress 
                      value={(stats.machine_stats.in_use_machines / stats.machine_stats.total_machines) * 100} 
                      colorScheme="blue"
                      size="sm"
                      mb={2}
                    />
                    <Text fontSize="sm" color="gray.500">Machines currently in use</Text>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader pb={0}>
                    <Stat>
                      <StatLabel>Daily Revenue</StatLabel>
                      <StatNumber>${stats.revenue_stats.daily_revenue.toFixed(2)}</StatNumber>
                    </Stat>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500">Revenue in the last 24 hours</Text>
                  </CardBody>
                </Card>
              </SimpleGrid>
              
              {/* Machine status breakdown */}
              <Card mb={8}>
                <CardHeader>
                  <Heading size="md">Machine Status</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box>
                      <Stat>
                        <StatLabel>Available</StatLabel>
                        <StatNumber>{stats.machine_stats.available_machines}</StatNumber>
                        <StatHelpText>
                          {stats.machine_stats.total_machines > 0 
                            ? ((stats.machine_stats.available_machines / stats.machine_stats.total_machines) * 100).toFixed(0)
                            : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                    <Box>
                      <Stat>
                        <StatLabel>In Use</StatLabel>
                        <StatNumber>{stats.machine_stats.in_use_machines}</StatNumber>
                        <StatHelpText>
                          {stats.machine_stats.total_machines > 0 
                            ? ((stats.machine_stats.in_use_machines / stats.machine_stats.total_machines) * 100).toFixed(0)
                            : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                    <Box>
                      <Stat>
                        <StatLabel>Maintenance</StatLabel>
                        <StatNumber>{stats.machine_stats.maintenance_machines}</StatNumber>
                        <StatHelpText>
                          {stats.machine_stats.total_machines > 0 
                            ? ((stats.machine_stats.maintenance_machines / stats.machine_stats.total_machines) * 100).toFixed(0)
                            : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </>
          )}

          {/* User Dashboard - for both admin and regular users */}
          {/* Regular user dashboard */}
          {!isAdmin() && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
              <Card>
                <CardHeader pb={0}>
                  <Stat>
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber>${stats.user_stats.balance?.toFixed(2) || '0.00'}</StatNumber>
                  </Stat>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Your current account balance</Text>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader pb={0}>
                  <Stat>
                    <StatLabel>Active Sessions</StatLabel>
                    <StatNumber>{stats.session_stats.active_sessions}</StatNumber>
                  </Stat>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Your current active sessions</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}
          
          {/* Recent sessions - for both user types */}
          <Card>
            <CardHeader>
              <Heading size="md">Recent Sessions</Heading>
            </CardHeader>
            <CardBody>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>User</Th>
                      <Th>Machine</Th>
                      <Th>Started At</Th>
                      <Th>Status</Th>
                      <Th>Time Remaining</Th>
                      {isAdmin() && <Th>Actions</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stats.recent_sessions.length === 0 ? (
                      <Tr>
                        <Td colSpan={isAdmin() ? 6 : 5} textAlign="center">No recent sessions found</Td>
                      </Tr>
                    ) : (
                      stats.recent_sessions.map(session => (
                        <Tr key={session.id}>
                          <Td>{session.username}</Td>
                          <Td>{session.machine_name}</Td>
                          <Td>{new Date(session.start_time).toLocaleString()}</Td>
                          <Td>
                            <Badge colorScheme={session.is_active ? 'green' : 'gray'}>
                              {session.is_active ? 'Active' : 'Ended'}
                            </Badge>
                          </Td>
                          <Td>
                            {session.is_active ? (
                              <HStack>
                                <TimeIcon />
                                <Text>{calculateTimeRemaining(session)}</Text>
                              </HStack>
                            ) : (
                              <Text>{session.duration ? `${session.duration.toFixed(2)} hours` : 'N/A'}</Text>
                            )}
                          </Td>
                          {isAdmin() && (
                            <Td>
                              {session.is_active && (
                                <Button
                                  colorScheme="red"
                                  size="xs"
                                  onClick={() => handleEndSession(session.id)}
                                >
                                  End
                                </Button>
                              )}
                            </Td>
                          )}
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Dashboard;