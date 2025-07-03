import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import RequestForm from "@/components/RequestForm";
import RequestsList from "@/components/RequestsList";
import Reports from "@/components/Reports";
import UserManagement from "@/components/UserManagement";
import CarrierManagement from "@/components/CarrierManagement";
import RouteOptimization from "@/components/RouteOptimization";
import CostCalculator from "@/components/CostCalculator";
import TrackingSystem from "@/components/TrackingSystem";
import NotFound from "@/pages/not-found";

export default function Home() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/requests" component={RequestsList} />
        <Route path="/create" component={RequestForm} />
        <Route path="/reports" component={Reports} />
        <Route path="/users" component={UserManagement} />
        <Route path="/carriers" component={CarrierManagement} />
        <Route path="/routes" component={RouteOptimization} />
        <Route path="/calculator" component={CostCalculator} />
        <Route path="/tracking" component={TrackingSystem} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
