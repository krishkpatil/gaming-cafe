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
  IconButton,
  VStack,
  Link
} from '@chakra-ui/react';
import { TimeIcon, RepeatIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
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
  const refreshTimerRef = useRef(null);

  // Fetch stats on component mount
  useEffect(() => {
    fetchDashboardStats();
    
    // Set up timer to refresh stats every minute
    timerRef.current = setInterval(() => {
      fetchDashboardStats(false); // Don't show loading spinner for refreshes
    }, 60000);
    
    // Set up timer to update time displays every 15 seconds without API call
    refreshTimerRef.current = setInterval(() => {
      setStats(prevStats => ({...prevStats}));
    }, 15000);
    
    // Clean up timers on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
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

  // Calculate remaining time data for active sessions
  const calculateTimeRemainingData = (session) => {
    if (!session || !session.start_time || !session.hourly_rate || session.hourly_rate <= 0) {
      return {
        hours: 0,
        minutes: 0,
        totalMinutes: 0,
        formatted: "00:00",
        percentage: 0,
        status: "expired"
      };
    }
    
    // Get user balance from session
    const userBalance = session.user_balance || 0;
    
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
    const totalMinutes = hours * 60 + minutes;
    
    // Format as HH:MM
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formatted = `${formattedHours}:${formattedMinutes}`;
    
    // Calculate percentage for progress bar
    // Assuming max session time is 8 hours (480 minutes)
    const maxSessionMinutes = 480;
    const percentage = Math.min(100, (totalMinutes / maxSessionMinutes) * 100);
    
    // Determine status for color coding
    let status = "normal";
    if (totalMinutes <= 15) {
      status = "critical";
    } else if (totalMinutes <= 30) {
      status = "warning";
    }
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted,
      percentage,
      status
    };
  };

  // Get progress color based on remaining time status
  const getProgressColor = (status) => {
    switch (status) {
      case "critical":
        return "red";
      case "warning":
        return "orange";
      default:
        return "blue";
    }
  };

  // Filter sessions for regular users
  const getFilteredSessions = () => {
    if (!user || !stats.recent_sessions) return [];
    
    if (isAdmin()) {
      // Admin sees all sessions
      return stats.recent_sessions;
    } else {
      // Regular users only see their own sessions
      return stats.recent_sessions.filter(session => 
        session.user_id === user.id
      );
    }
  };

  const filteredSessions = getFilteredSessions();

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
                      value={stats.machine_stats.total_machines > 0 ? 
                        (stats.machine_stats.in_use_machines / stats.machine_stats.total_machines) * 100 : 0} 
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
                          {stats.machine_stats.total_machines > 0 ? 
                            ((stats.machine_stats.available_machines / stats.machine_stats.total_machines) * 100).toFixed(0) : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                    <Box>
                      <Stat>
                        <StatLabel>In Use</StatLabel>
                        <StatNumber>{stats.machine_stats.in_use_machines}</StatNumber>
                        <StatHelpText>
                          {stats.machine_stats.total_machines > 0 ? 
                            ((stats.machine_stats.in_use_machines / stats.machine_stats.total_machines) * 100).toFixed(0) : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                    <Box>
                      <Stat>
                        <StatLabel>Maintenance</StatLabel>
                        <StatNumber>{stats.machine_stats.maintenance_machines}</StatNumber>
                        <StatHelpText>
                          {stats.machine_stats.total_machines > 0 ? 
                            ((stats.machine_stats.maintenance_machines / stats.machine_stats.total_machines) * 100).toFixed(0) : 0}%
                        </StatHelpText>
                      </Stat>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </>
          )}

          {/* User Dashboard - for regular users */}
          {!isAdmin() && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
              <Card>
                <CardHeader pb={0}>
                  <Stat>
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber>${(user?.balance || 0).toFixed(2)}</StatNumber>
                  </Stat>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Your current account balance</Text>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader pb={0}>
                  <Stat>
                    <StatLabel>My Active Sessions</StatLabel>
                    <StatNumber>{
                      filteredSessions.filter(session => session.is_active && session.user_id === user?.id).length
                    }</StatNumber>
                  </Stat>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Your current active sessions</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}
          
          {/* Recent sessions - filtered based on user role */}
          <Card>
            <CardHeader>
              <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">{isAdmin() ? 'Recent Sessions' : 'My Sessions'}</Heading>
                {!isAdmin() && (
                  <Link as={RouterLink} to="/profile" color="blue.500">
                    View Profile <ExternalLinkIcon mx="2px" />
                  </Link>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      {isAdmin() && <Th>User</Th>}
                      <Th>Machine</Th>
                      <Th>Started At</Th>
                      <Th>Status</Th>
                      <Th>Time Remaining</Th>
                      {isAdmin() && <Th>Actions</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredSessions.length === 0 ? (
                      <Tr>
                        <Td colSpan={isAdmin() ? 6 : 4} textAlign="center">
                          {isAdmin() ? 'No recent sessions found' : 'You have no recent sessions'}
                        </Td>
                      </Tr>
                    ) : (
                      filteredSessions.map(session => {
                        const timeData = calculateTimeRemainingData(session);
                        return (
                          <Tr key={session.id}>
                            {isAdmin() && <Td>{session.username}</Td>}
                            <Td>{session.machine_name}</Td>
                            <Td>{new Date(session.start_time).toLocaleString()}</Td>
                            <Td>
                              <Badge colorScheme={session.is_active ? 'green' : 'gray'}>
                                {session.is_active ? 'Active' : 'Ended'}
                              </Badge>
                            </Td>
                            <Td>
                              {session.is_active ? (
                                <Box>
                                  <HStack mb={1}>
                                    <TimeIcon />
                                    <Text fontWeight="bold" color={timeData.status === "critical" ? "red.500" : undefined}>
                                      {timeData.formatted} left
                                    </Text>
                                  </HStack>
                                  <Progress 
                                    value={timeData.percentage} 
                                    size="sm" 
                                    colorScheme={getProgressColor(timeData.status)}
                                  />
                                </Box>
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
                        );
                      })
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