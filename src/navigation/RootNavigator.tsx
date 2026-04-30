import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import BillingScreen from '../screens/BillingScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import CashiersScreen from '../screens/CashiersScreen';
import CustomersScreen from '../screens/CustomersScreen';
import CompaniesScreen from '../screens/CompaniesScreen';
import CompanyFormScreen from '../screens/CompanyFormScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RegisterCompanyScreen from '../screens/RegisterCompanyScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PaymentPendingScreen from '../screens/PaymentPendingScreen';
import CreditSettingsScreen from '../screens/CreditSettingsScreen';
import TaxSettingsScreen from '../screens/TaxSettingsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { PremiumTabBar } from './PremiumTabBar';
import { Screen, Loader } from '../components/ui';
import { colors, TAB_BAR_CONTENT_INSET } from '../theme/tokens';

import {
  LayoutDashboard,
  Package,
  FolderTree,
  Receipt,
  Users,
  Building2,
  MoreHorizontal,
  ScanLine,
  FileText,
  Contact,
  Wallet,
  Percent,
  Settings,
  Clock,
} from 'lucide-react-native';

const RootStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bgMid,
    primary: colors.primary,
    card: colors.surface,
    text: colors.text,
    border: colors.borderLight,
  },
};

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} />
      <MoreStack.Screen name="PaymentPending" component={PaymentPendingScreen} />
      <MoreStack.Screen name="CreditSettings" component={CreditSettingsScreen} />
      <MoreStack.Screen name="TaxSettings" component={TaxSettingsScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
    </MoreStack.Navigator>
  );
}

const tabScreenOptions = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarStyle: { position: 'absolute' as const, height: 0 },
  sceneContainerStyle: { paddingBottom: TAB_BAR_CONTENT_INSET },
};

function AdminTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <PremiumTabBar {...p} />} screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => <FolderTree color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color, size }) => <Contact color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Cashiers"
        component={CashiersScreen}
        options={{
          tabBarLabel: 'Team',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function CashierTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <PremiumTabBar {...p} />} screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarLabel: 'Billing',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function SuperadminTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <PremiumTabBar {...p} />} screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Companies"
        component={CompaniesScreen}
        options={{
          tabBarLabel: 'Companies',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RoleHome() {
  const { role } = useAuth();
  if (role === 'superadmin') {
    return <SuperadminTabs />;
  }
  if (role === 'admin') {
    return <AdminTabs />;
  }
  return <CashierTabs />;
}

function AuthenticatedStack() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgMid },
      }}
    >
      <AppStack.Screen name="Home" component={RoleHome} />
      <AppStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{
          headerShown: true,
          title: 'Invoice',
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700', color: colors.text, fontSize: 18 },
        }}
      />
      <AppStack.Screen
        name="CompanyForm"
        component={CompanyFormScreen}
        options={{
          headerShown: true,
          title: 'New company',
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700', color: colors.text, fontSize: 18 },
        }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, loading, role } = useAuth();

  if (loading) {
    return (
      <Screen edges={['top', 'right', 'left', 'bottom']}>
        <Loader message="Starting…" />
      </Screen>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
        {token && role ? (
          <RootStack.Screen name="App" component={AuthenticatedStack} />
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
            <RootStack.Screen name="RegisterCompany" component={RegisterCompanyScreen} />
            <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
