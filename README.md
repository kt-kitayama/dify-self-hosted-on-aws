# Dify on AWS with CDK（日本語版）

[![Build](https://github.com/aws-samples/dify-self-hosted-on-aws/actions/workflows/build.yml/badge.svg)](https://github.com/aws-samples/dify-self-hosted-on-aws/actions/workflows/build.yml)

AWSマネージドサービスとAWS CDKを使って、[Dify](https://dify.ai/)（LLMアプリ開発プラットフォーム）をセルフホストできます。

![architecture](./imgs/architecture.png)

主な特徴:

* メンテナンス負荷の少ないフルマネージドサービス
    * Aurora servereless v2、ElastiCache、ECS Fargateなど
* コスト効率の高いアーキテクチャ設計
    * NAT Gatewayの代わりにNATインスタンス利用や、Fargateスポットキャパシティをデフォルトで利用可能
* BedrockモデルやKnowledge Basesとの簡単な連携

## クイックスタート

手軽にデプロイしたい場合は、ワンクリックデプロイオプションをご利用ください:
* [Dify on AWSのワンクリックデプロイ](https://github.com/aws-samples/sample-one-click-generative-ai-solutions?tab=readme-ov-file#dify-on-aws)

本リポジトリの使い方について、日本語で書かれた記事もあります: 
* [AWS CDKでDifyを一撃構築](https://note.com/yukkie1114/n/n0d9c5551569f) ( [CloudShell版](https://note.com/yukkie1114/n/n8e055c4e7566) )
* [AWSマネージドサービスで Dify のセルフホスティングを試してみた](https://dev.classmethod.jp/articles/dify-self-hosting-aws/)

## 前提条件
このアプリをデプロイするには、以下の依存関係が必要です:

* [Node.js](https://nodejs.org/en/download/) (v18以上)
* [Docker](https://docs.docker.com/get-docker/)
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) およびAdministrator権限のIAMプロファイル

## デプロイ方法
AWSリージョンなどの設定パラメータは [`bin/cdk.ts`](bin/cdk.ts) で変更できます。利用可能な全パラメータは [`EnvironmentProps` インターフェース](./lib/environment-props.ts) をご確認ください。

> [!IMPORTANT]
> > Dify v0からv1へアップグレードする場合は、[Dify v0からv1へのアップグレード](#upgrading-dify-v0-to-v1)を参照してください。

以下のコマンドで全スタックをデプロイできます。

```sh
# npm依存パッケージのインストール
npm ci
# AWSアカウントのブートストラップ（アカウント・リージョンごとに1回のみ必要）
npx cdk bootstrap
# CDKスタックのデプロイ
npx cdk deploy --all
```

初回デプロイは約20分かかります。デプロイ成功後、アプリのURLが表示されます。

```
 ✅  DifyOnAwsCdkStack

✨  Deployment time: 326.43s

Outputs:
DifyOnAwsStack.DifyUrl = https://dify.example.com
```

URLをブラウザで開いて利用を開始できます！

### CloudShellからのデプロイ

[AWS CloudShell](https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html)のようなストレージ制限のある環境でも動作する専用スクリプトがあります。

CloudShellでは、以下のコマンドを実行してください:

```sh
git clone https://github.com/aws-samples/dify-self-hosted-on-aws.git
cd dify-self-hosted-on-aws
./simple-deploy.sh
```

シェルスクリプトの指示に従って進めてください。最終的にCLIで `DifyOnAwsStack.DifyUrl` が出力されます。

## Tips

AWS上でDifyを使う際に役立つ情報です。

### DifyでBedrockを利用する設定

ログイン後、DifyでBedrock LLMを利用する設定ができます。

> [!IMPORTANT]  
> Difyでモデルを設定する前に、Bedrock管理コンソールで利用したいモデルを**有効化**してください。詳細は[こちらのドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html#model-access-add)を参照。

右上のプロフィールから設定画面へ進み、`WORKSPACE -> Model Provider`をクリックし、`AWS Bedrock model`を選択します。

IAMポリシーは既に適切に設定されているため、Bedrockモデルが有効なAWSリージョンを選択し、`Save`をクリックするだけで利用できます。

![model-setup](./imgs/model-setup.png)

### コード実行で利用可能なPythonパッケージの追加

Difyのコード実行機能で利用可能なPythonパッケージを追加できます。[python-requirements.txt](./lib/constructs/dify-services/docker/python-requirements.txt)を[Requirements File Format](https://pip.pypa.io/en/stable/reference/requirements-file-format/)に従って編集してください。

一部のライブラリでは、Difyサンドボックスで追加のシステムコール許可が必要です。このCDKプロジェクトでは、[`bin/cdk.ts`](bin/cdk.ts)の`allowAnySysCalls`フラグで全システムコールを許可できます。

> [!WARNING]
> `allowAnySysCalls`を有効にする場合、Difyテナントで実行されるコードが完全に信頼できることを確認してください。

詳細は以下のブログ記事も参照してください: [Difyのコードブロックで任意のPythonライブラリを使う](https://tmokmss.hatenablog.com/entry/use-any-python-packages-on-dify-sandbox)

### Bedrock Knowledge Basesへの接続

[外部ナレッジベース機能](https://docs.dify.ai/guides/knowledge-base/connect-external-knowledge)を使って[Amazon Bedrock Knowledge Bases](https://aws.amazon.com/bedrock/knowledge-bases/)に接続できます。外部ナレッジAPIはDify APIのサイドカーとしてデプロイされるため、以下の手順ですぐに利用可能です:

1. Dify -> Knowledge -> Add an External Knowledge APIボタンをクリック
    * ![add external knowledge api](./imgs/add-external-knowledge-api.png)
2. 以下のようにフォームを入力:
    1. Name: 任意（例: `Bedrock Knowledge Bases`）
    2. API Endpoint: `http://localhost:8000`
    3. API Key: `dummy-key`（`BEARER_TOKEN`環境変数で設定可能。[`api.ts`](./lib/constructs/dify-services/api.ts)を参照）
3. Dify -> Knowledge -> Create Knowledge -> Connect to an External Knowledge Baseをクリック
    * ![Connect to an External Knowledge Base](./imgs/connect-to-an-externa-lknowledge-base.png)
4. 以下のようにフォームを入力
    1. External Knowledge Name / Knowledge Description: 任意の文字列
    2. External Knowledge API: 前ステップで作成した外部API
    3. External Knowledge ID: 利用したいBedrock Knowledge Base ID。AWSリージョンはデフォルトus-west-2ですが、`us-east-1:QWERTYASDF`のようにリージョンプレフィックスで上書き可能。
5. これでDifyツールからナレッジを利用できます。

詳細は以下の記事も参照してください: [Difyでグラフやチャート付きドキュメントもRAGできる！](https://qiita.com/mabuchs/items/85fb2dad19ec441c870c)

### スケールアウト／スケールアップ

本システムはスケーラビリティを考慮して設計されていますが、多数ユーザー対応のために明示的に設定できるパラメータもあります。

主な設定可能パラメータとデフォルト値は以下の通りです:

1. ECSタスク（[api.ts](./lib/constructs/dify-services/api.ts), [web.ts](./lib/constructs/dify-services/web.ts)）
    1. サイズ
        1. api/worker: 1024vCPU / 2048MB
        2. web: 256vCPU / 512MB
    2. Desired Count
        1. 各サービス1タスク
2. ElastiCache（[redis.ts](./lib/constructs/redis.ts)）
    1. ノードタイプ: `cache.t4g.micro`
    2. ノード数: 1
3. Aurora Postgres（[postgres.ts](./lib/constructs/postgres.ts)）
    1. Serverless v2最大キャパシティ: 2 ACU

### 閉域（インターネット非接続）環境へのデプロイ

インターネットゲートウェイやNATゲートウェイのないVPC（閉域）にも簡単な追加手順でデプロイ可能です。

閉域環境でのデプロイ手順:

1. `bin/cdk.ts`で以下のように設定:
    ```ts
    export const props: EnvironmentProps = {
        // リージョン・アカウントを明示的に指定
        awsRegion: 'ap-northeast-1',
        awsAccount: '123456789012',

        // 内部IPアドレス範囲を指定
        allowedIPv4Cidrs: ['10.0.0.0/16'],

        // 閉域デプロイ用の2つのフラグ
        useCloudFront: false,
        internalAlb: true,

        // Docker HubがVPCサブネットからアクセス不可の場合はこのプロパティを設定し、copy-to-ecrスクリプトを実行（step#2参照）
        customEcrRepositoryName: 'dify-images',

        // CDKに閉域VPCを作成させる場合
        vpcIsolated: true,
        // 既存VPCをインポートする場合（任意）
        vpcId: 'vpc-12345678',

        // その他のプロパティは任意で設定
    };
    ```

2. [`python-requirements.txt`](lib/constructs/dify-services/docker/sandbox/python-requirements.txt)を開き、全依存パッケージを削除
    * [PyPI](https://pypi.org/)がVPCサブネットからアクセス不可の場合のみ必要
3. Docker Hub上のdifyコンテナイメージをECRリポジトリにコピー（`npx ts-node scripts/copy-to-ecr.ts`）
    * スクリプトが全て自動で処理。事前に`npm ci`も必要。
        * `customEcrRepositoryName`名のECRリポジトリは自分で作成してもよいし、スクリプトが自動作成も可能。
        * このスクリプトはインターネット接続環境で実行する必要あり。
        * `difyImageTag`や`difySandboxImageTag`を変更した場合は毎回実行。
    * [Docker Hub](https://www.docker.com/products/docker-hub/)がVPCサブネットからアクセス不可の場合のみ必要
4. 既存VPC（`vpcId`プロパティ）を使う場合は、必要なVPCエンドポイントを事前に作成
    * 必要なVPCエンドポイント一覧は[`vpc-endpoints.ts`](lib/constructs/vpc-endpoints.ts)を参照
    * CDKにVPC作成を任せる場合（`vpcIsolated: true`）、全エンドポイントは自動作成
5. [デプロイ方法](#deploy)に従いCDKプロジェクトをデプロイ
6. デプロイ後、DifyでBedrockをVPCと同じAWSリージョンで設定（[Bedrock設定手順](#setup-dify-to-use-bedrock)参照）
    * 他リージョンのBedrock APIがVPCサブネットからアクセス不可の場合のみ必要

### 追加環境変数の設定

Difyコンテナに追加の環境変数を設定するには、`additionalEnvironmentVariables`プロパティを利用します:

```typescript
new DifySelfHostedOnAwsStack(app, 'DifySelfHostedOnAwsStack', {
  additionalEnvironmentVariables: [
    {
      // 全コンテナに適用する例
      key: 'GLOBAL_SETTING',
      value: 'value',
      // targets省略時は全コンテナに適用
    },
    {
      // Systems Managerパラメータ参照例
      key: 'CONFIG_PARAM',
      value: { parameterName: 'my-parameter' },
      targets: ['web', 'api'],
    },
    {
      // Secrets Managerの特定フィールド参照例
      key: 'API_KEY',
      value: { secretName: 'my-secret', field: 'apiKey' },
      targets: ['worker'],
    },
  ],
});
```

この機能でDifyコンテナにカスタム環境変数を注入できます。`targets`で指定できるコンテナタイプは `'web'`, `'api'`, `'worker'`, `'sandbox'` です。

### Notionとの連携

[Notion](https://www.notion.com/)データと連携するには、以下の手順で行います:

1. Notion Secret Tokenを取得: [Notion - Authorization](https://developers.notion.com/docs/authorization)

2. Secrets Managerシークレットを作成:
```sh
 NOTION_INTERNAL_SECRET="NOTION_SECRET_REPLACE_THIS"
 aws secretsmanager create-secret \
    --name NOTION_INTERNAL_SECRET \
    --description "Secret for Notion internal use" \
    --secret-string ${NOTION_INTERNAL_SECRET}
```

3. `bin/cdk.ts`で`additionalEnvironmentVariables`を以下のように設定:
```ts
export const props: EnvironmentProps = {
  // 追加
  additionalEnvironmentVariables: [
    {
      key: 'NOTION_INTEGRATION_TYPE',
      value: 'internal',
      targets: ['api'], 
    },
    {
      key: 'NOTION_INTERNAL_SECRET',
      value: { secretName: 'NOTION_INTERNAL_SECRET'},
      targets: ['api'], 
    },
  ],
}
```

4. `cdk deploy`でスタックをデプロイ
5. [Notionからデータをインポート](https://docs.dify.ai/guides/knowledge-base/create-knowledge-and-upload-documents/1.-import-text-data/1.1-import-data-from-notion)できるようになります。

### ユーザー招待用メール（SMTP）設定

Difyで新規ユーザー招待やパスワードリセットメールを送信できます。利用には`bin/cdk.ts`で`setupEmail`プロパティを`true`に設定してください。`domainName`ごとに1つのメールサーバー（Amazon SES Identity）のみ設定可能です。

デプロイ後、SESサンドボックスから本番環境へ移行する必要があります。詳細は[Amazon SESサンドボックスからの移行](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)を参照してください。

### Dify v0からv1へのアップグレード
Difyをv0からv1へアップグレードする場合、以下のマイグレーション手順が必要です。

1. lib/dify-on-aws-stack.ts（`ApiService`コンストラクト）で`autoMigration: false`を設定
2. `difyImageTag: 1.0.0`（`bin/cdk.ts`）でプロジェクトをデプロイし、次の2つのコマンドが表示されます
   ```sh
    DifyOnAwsStack.ConsoleConnectToTaskCommand = aws ecs execute-command --region ap-northeast-1 --cluster DifyOnAwsStack-ClusterEB0386A7-redacted --container Main --interactive --command "bash" --task TASK_ID
    DifyOnAwsStack.ConsoleListTasksCommand = aws ecs list-tasks --region ap-northeast-1 --cluster DifyOnAwsStack-ClusterEB0386A7-redacted  --service-name DifyOnAwsStack-ApiServiceFargateServiceE4EA9E4E-redacted --desired-status RUNNING
   ```
3. `ConsoleListTasksCommand`でECSタスクARNを取得
4. `ConsoleConnectToTaskCommand`の`TASK_ID`をタスクARNに置き換えて実行
5. Dify環境で以下2コマンドを実行（[Dify v1.0.0リリースノート](https://github.com/langgenius/dify/releases/tag/1.0.0)参照）:
   ```sh
   poetry run flask extract-plugins --workers=20
   poetry run flask install-plugins --workers=2
   ```
6. コマンド実行後、`autoMigration: true`に設定し、CDKを再デプロイ。これでDify v1に移行完了です。

## クリーンアップ
今後の課金を防ぐため、作成したリソースを削除してください。

```sh
npx cdk destroy --force
# 削除時にエラーが出た場合は再実行してください。たまに発生します。
```

`customEcrRepositoryName`を設定し`copy-to-ecr.ts`スクリプトを実行した場合は、ECRリポジトリとイメージも手動で削除してください。

## コスト

以下はus-east-1（バージニア北部）リージョンで本システムを安価な構成で1ヶ月運用した場合のサンプルコストです。

| AWS service | Dimensions | Cost [USD/month] |
| --------------------| ----------------- | -------------------------------|
| RDS Aurora | Postgres Serverless v2 (0 ACU) | $0 |
| ElastiCache | Valkey t4g.micro | $9.2 |
| ECS (Fargate) | Dify-web 1 task running 24/7 (256CPU) | $2.7 |
| ECS (Fargate) | Dify-api/worker 1 task running 24/7 (1024CPU) | $10.7 |
| Application Load Balancer | ALB-hour per month | $17.5 |
| VPC | NAT Instances t4g.nano x1 | $3.0 |
| VPC | Public IP address x1 | $3.6 |
| Secrets Manager | Secret x3 | $1.2 |
| TOTAL | estimate per month | $47.9 |

上記に加え、LLM利用料（例: Amazon Bedrock）が発生します。これはユースケースにより大きく異なります。


## セキュリティ

詳細は[CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications)を参照してください。

## ライセンス

本ライブラリはMIT-0ライセンスです。LICENSEファイルを参照してください。また[Difyのライセンス](https://github.com/langgenius/dify/blob/main/LICENSE)もご確認ください。

## 謝辞
このCDKコードは [dify-aws-terraform](https://github.com/sonodar/dify-aws-terraform) に大きくインスパイアされています。
