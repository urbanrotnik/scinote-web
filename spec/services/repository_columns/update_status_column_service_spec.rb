# frozen_string_literal: true

require 'rails_helper'

describe RepositoryColumns::UpdateStatusColumnService do
  let(:user) { create :user }
  let!(:user_team) { create :user_team, :admin, user: user, team: team }
  let(:team) { create :team }
  let(:repository) { create :repository, team: team }
  let(:column) { create :repository_column, :status_type }
  let(:status_item) { create(:repository_status_item, repository: repository, repository_column: column) }
  let(:service_call) do
    RepositoryColumns::UpdateStatusColumnService.call(column: column,
                                                      user: user,
                                                      team: team,
                                                      params: params)
  end

  context 'when updates column' do
    let(:params) { { name: 'my new column' } }

    it 'updates RepositoryColumn record' do
      column

      expect { service_call }.to change(column, :name)
    end

    it 'adds Activity record' do
      expect { service_call }.to(change { Activity.count }.by(1))
    end
  end

  context 'when updates column\'s status items ' do
    let(:params) do
      {
        repository_status_items_attributes: [
          { id: status_item.id, status: 'my new status' }
        ]
      }
    end

    it 'updates status' do
      expect { service_call }.to(change { status_item.reload.status })
    end

    context 'when deletes status items' do
      let(:params) do
        {
          repository_status_items_attributes: [
            { id: status_item.id, _destroy: true }
          ]
        }
      end

      it 'removes RepositoryStatusItem record' do
        status_item

        expect { service_call }.to(change { RepositoryStatusItem.count }.by(-1))
      end
    end

    context 'when valdiations not passed' do
      let(:params) do
        {
          repository_status_items_attributes: [
            { id: status_item.id, status: '' }
          ]
        }
      end

      it 'returns AR errors' do
        expect(service_call.errors).to have_key(:repository_column)
      end

      it 'returns succeed false' do
        expect(service_call.succeed?).to be_falsey
      end
    end
  end
end