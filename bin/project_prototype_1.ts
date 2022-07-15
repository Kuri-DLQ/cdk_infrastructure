#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainAndDlqStack } from '../lib/MainAndDlqStack';
import { DlqOnlyStack } from '../lib/DlqOnlyStack';

const app = new cdk.App();
new MainAndDlqStack(app, 'MainAndDlqStack');
new DlqOnlyStack(app, 'DlqOnlyStack');