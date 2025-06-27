import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import RequestForm from "@/components/RequestForm";
import RequestsList from "@/components/RequestsList";
import Reports from "@/components/Reports";
import UserManagement from "@/components/UserManagement";
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}
