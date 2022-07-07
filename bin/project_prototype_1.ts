#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProjectPrototype1Stack } from '../lib/project_prototype_1-stack';

const app = new cdk.App();
new ProjectPrototype1Stack(app, 'ProjectPrototype1Stack');